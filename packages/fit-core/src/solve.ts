/**
 * The deterministic fit solver. Ported from `solvePosture` in
 * docs/prototype.html into a pure function over CanonicalBike. No Three.js, no
 * I/O, no randomness — same input → same output, in browser and on server.
 *
 * Everything is computed in BB-anchored SI coordinates (origin = bottom
 * bracket, +x forward, +y up, metres / radians). The prototype anchored the
 * vertical axis at the ground; since every reported metric is an angle or a
 * difference, the BB-anchored frame yields identical results.
 */

import type { CanonicalBike, Vec2 } from '@dtf/geometry';
import { metresToMm, radToDeg } from '@dtf/geometry';

import { ANTHRO, RIG } from './model.js';
import { WINDOWS, classify, type WindowName } from './windows.js';
import type {
  Adjustments,
  FitState,
  FitWarning,
  Metric,
  RiderMeasurements,
  RiderSegments,
} from './types.js';
import { add, angleAt, clamp, dist, normalize, perpCCW, scale, sub } from './vec.js';

/** Result of a 2-bone IK solve: the mid-joint, plus whether the limb was capped. */
interface IkResult {
  readonly joint: Vec2;
  readonly clamped: boolean;
}

/**
 * 2-bone IK: place the mid-joint between `root` and `target` given segment
 * lengths `l1` (root→mid) and `l2` (mid→target). `bendSign` picks the side the
 * joint falls on. If the target is unreachable the distance is capped (and
 * `clamped` is set) so the limb straightens instead of detaching.
 */
export function solveTwoBone(
  root: Vec2,
  target: Vec2,
  l1: number,
  l2: number,
  bendSign: number,
): IkResult {
  const d = sub(target, root);
  const original = Math.hypot(d.x, d.y);
  const maxReach = l1 + l2;
  let distance = original;
  let clamped = false;
  if (distance > maxReach * 0.999) {
    distance = maxReach * 0.999;
    clamped = true;
  }
  const minReach = Math.abs(l1 - l2) + 1e-4;
  if (distance < minReach) distance = minReach;

  const dir = normalize(d);
  const a = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mid = add(root, scale(dir, a));
  const joint = add(mid, scale(perpCCW(dir), h * bendSign));
  return { joint, clamped };
}

/** Result of placing the shoulder by circle intersection. */
interface ShoulderResult {
  readonly point: Vec2;
  readonly reachable: boolean;
}

/**
 * Place the shoulder as the upper intersection of two circles: torso length
 * about the hip and arm reach about the grip. If the hands cannot reach the
 * bars (`reachable === false`) the shoulder is placed along the line at torso
 * length so the pose degrades gracefully.
 */
export function placeShoulder(hip: Vec2, torso: number, grip: Vec2, armReach: number): ShoulderResult {
  const d = sub(grip, hip);
  let distance = Math.hypot(d.x, d.y);
  const dir = normalize(d);
  if (distance > torso + armReach) {
    return { point: add(hip, scale(dir, torso)), reachable: false };
  }
  const minReach = Math.abs(torso - armReach);
  if (distance < minReach) distance = minReach + 1e-4;

  const a = (torso * torso - armReach * armReach + distance * distance) / (2 * distance);
  const h = Math.sqrt(Math.max(0, torso * torso - a * a));
  const mid = add(hip, scale(dir, a));
  const perp = scale(perpCCW(dir), h);
  const s1 = add(mid, perp);
  const s2 = sub(mid, perp);
  return { point: s1.y >= s2.y ? s1 : s2, reachable: true };
}

/** Derive body-segment lengths from measurements via the anthropometric ratios. */
export function deriveSegments(rider: RiderMeasurements): RiderSegments {
  const legTotal = rider.inseamM * ANTHRO.legToInseam;
  const upperArm = rider.heightM * ANTHRO.upperArmOfHeight;
  const forearm = rider.heightM * ANTHRO.forearmOfHeight;
  return {
    thigh: legTotal * ANTHRO.thighOfLeg,
    shank: legTotal * ANTHRO.shankOfLeg,
    torso: rider.heightM * ANTHRO.torsoOfHeight,
    upperArm,
    forearm,
    armReach: (upperArm + forearm) * ANTHRO.armReachFactor,
    headRadius: rider.heightM * ANTHRO.headRadiusOfHeight,
    neck: rider.heightM * ANTHRO.neckOfHeight,
  };
}

/** Pedal + ankle positions at the evaluation pose, BB-anchored. */
function pedalRig(bb: Vec2, crankLength: number): { ankleDown: Vec2; ankleUp: Vec2 } {
  const ca = RIG.crankDownAngleRad;
  const pedDown: Vec2 = { x: bb.x + crankLength * Math.sin(ca), y: bb.y - crankLength * Math.cos(ca) };
  const pedUp: Vec2 = { x: bb.x - crankLength * Math.sin(ca), y: bb.y + crankLength * Math.cos(ca) };
  return {
    ankleDown: { x: pedDown.x, y: pedDown.y + RIG.pedalAnkleRise },
    ankleUp: { x: pedUp.x, y: pedUp.y + RIG.pedalAnkleRise },
  };
}

function lengthMetric(si: number): Metric {
  return { kind: 'length', si };
}

function angleMetric(si: number, windowName?: WindowName): Metric {
  if (windowName === undefined) return { kind: 'angle', si };
  const window = WINDOWS[windowName];
  return { kind: 'angle', si, window, status: classify(windowName, radToDeg(si)) };
}

/**
 * Solve the rider's posture and fit metrics on a bike at the given adjustments.
 * Pure and deterministic.
 */
export function solve(
  rider: RiderMeasurements,
  bike: CanonicalBike,
  adjustments: Adjustments,
): FitState {
  const seg = deriveSegments(rider);
  const bb = bike.points.bottomBracket;

  // Contact points: bottom bracket / pedal → saddle → grips (CLAUDE.md order).
  const crankLength = adjustments.crankLengthM ?? RIG.crankLength;
  const { ankleDown, ankleUp } = pedalRig(bb, crankLength);

  const saddle = add(bb, scale(bike.points.seatTubeAxis, adjustments.saddleHeightM));
  const hip = add(saddle, RIG.hipOffset);

  const stemLength = adjustments.stemLengthM ?? RIG.stemLength;
  const a = adjustments.stemAngleRad;
  const grip = add(bike.points.headTubeTop, { x: Math.cos(a) * stemLength, y: Math.sin(a) * stemLength });

  // Legs (down + up stroke), shoulder, arm, head.
  const legDown = solveTwoBone(hip, ankleDown, seg.thigh, seg.shank, 1);
  const legUp = solveTwoBone(hip, ankleUp, seg.thigh, seg.shank, 1);
  const shoulderRes = placeShoulder(hip, seg.torso, grip, seg.armReach);
  const shoulder = shoulderRes.point;
  const torsoDir = normalize(sub(shoulder, hip));
  const head = add(shoulder, scale(torsoDir, seg.neck + seg.headRadius));
  const elbow = solveTwoBone(shoulder, grip, seg.upperArm, seg.forearm, -1).joint;

  // Metrics.
  const kneeExtension = angleAt(hip, legDown.joint, ankleDown);
  const torsoAngle = Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x);
  const barDrop = saddle.y - grip.y;
  const stemReach = Math.cos(a) * stemLength;

  const warnings: FitWarning[] = [];
  if (legDown.clamped) {
    warnings.push({
      code: 'leg-over-extended',
      message: 'Saddle is too high — the leg cannot reach the bottom of the pedal stroke.',
    });
  }
  if (!shoulderRes.reachable) {
    warnings.push({
      code: 'bars-unreachable',
      message: 'The bars are out of reach for this torso and arm length.',
    });
  }

  return {
    joints: {
      hip,
      kneeDown: legDown.joint,
      ankleDown,
      kneeUp: legUp.joint,
      ankleUp,
      shoulder,
      elbow,
      hand: grip,
      head,
    },
    metrics: {
      saddleHeight: lengthMetric(adjustments.saddleHeightM),
      kneeExtension: angleMetric(kneeExtension, 'kneeExtension'),
      torsoAngle: angleMetric(torsoAngle, 'torsoAngle'),
      barDrop: lengthMetric(barDrop),
      stemReach: lengthMetric(stemReach),
    },
    warnings,
  };
}

/**
 * Suggest a starting fit from the rider and bike: a saddle height that puts the
 * down-stroke leg near full (but not locked) extension, and the default stem
 * angle. Ported from the prototype's `defaultSaddle` binary search.
 */
export function suggestAdjustments(rider: RiderMeasurements, bike: CanonicalBike): Adjustments {
  const seg = deriveSegments(rider);
  const bb = bike.points.bottomBracket;
  const { ankleDown } = pedalRig(bb, RIG.crankLength);
  const target = (seg.thigh + seg.shank) * RIG.saddleExtensionTarget;

  let lo: number = RIG.saddleSearch.lo;
  let hi: number = RIG.saddleSearch.hi;
  for (let i = 0; i < RIG.saddleSearch.iterations; i++) {
    const mid = (lo + hi) / 2;
    const saddle = add(bb, scale(bike.points.seatTubeAxis, mid));
    const hip = add(saddle, RIG.hipOffset);
    if (dist(hip, ankleDown) > target) hi = mid;
    else lo = mid;
  }

  return {
    saddleHeightM: clamp((lo + hi) / 2, RIG.saddleSearch.lo, RIG.saddleSearch.hi),
    stemAngleRad: RIG.defaultStemAngleRad,
  };
}

/** Convert a metric to display units (mm for lengths, degrees for angles). */
export function metricDisplay(metric: Metric): { value: number; unit: 'mm' | 'deg' } {
  return metric.kind === 'angle'
    ? { value: radToDeg(metric.si), unit: 'deg' }
    : { value: metresToMm(metric.si), unit: 'mm' };
}
