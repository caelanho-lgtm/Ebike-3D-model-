/**
 * Biomechanics fit engine.
 *
 * Given a rider's anthropometrics and the current cockpit/contact-point
 * parameters, it solves a 2-link inverse-kinematics model of the leg and the
 * torso/arm linkage to produce joint angles, an overall fit score and warnings.
 *
 * Coordinate frame: origin at the bottom bracket (BB), +x forward, +y up.
 * All lengths mm, angles degrees.
 */

import type { BikeGeometry } from '../geometry/bikeGeometry';

export type Flexibility = 'low' | 'medium' | 'high';

export interface RiderAnthropometrics {
  /** Standing height, mm. Required. */
  height: number;
  /** Inseam, mm. Estimated from height if omitted. */
  inseam?: number;
  /** Arm length, mm. Estimated if omitted. */
  armLength?: number;
  /** Torso length, mm. Estimated if omitted. */
  torsoLength?: number;
  flexibility: Flexibility;
}

/** The adjustable contact-point parameters driven by the UI sliders. */
export interface FitParameters {
  /** Saddle height: BB → saddle top along seat tube, mm. */
  saddleHeight: number;
  /** Saddle setback: saddle behind BB (horizontal), mm. */
  saddleSetback: number;
  /** Saddle tilt, degrees (nose up +, nose down −). */
  saddleTilt: number;
  /** Handlebar reach: BB → bar centre horizontal, mm. */
  handlebarReach: number;
  /** Handlebar height: BB → bar centre vertical, mm. */
  handlebarHeight: number;
  /** Stem angle, degrees (cosmetic + informs height). */
  stemAngle: number;
  /** Crank length, mm. */
  crankLength: number;
}

export interface FitWarning {
  severity: 'info' | 'warning' | 'critical';
  field: 'knee' | 'hip' | 'back' | 'reach' | 'saddle';
  message: string;
}

export interface FitResult {
  kneeAngle: number;
  hipAngle: number;
  backAngle: number;
  /** Saddle → bar horizontal reach, mm. */
  reach: number;
  saddleHeight: number;
  saddleSetback: number;
  /** Solved joint positions (mm, BB origin) for the renderer. */
  joints: {
    hip: Point;
    shoulder: Point;
    hand: Point;
    head: Point;
    kneeBottom: Point;
    ankleBottom: Point;
    kneeTop: Point;
  };
  fitScore: number;
  warnings: FitWarning[];
}

export interface Point {
  x: number;
  y: number;
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const toDeg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Intersect two circles (centres c0/c1, radii r0/r1). Returns the solution on
 * the requested side (`+1` = the one with greater y), or a best-effort point on
 * the centre line when the circles don't intersect (limbs can't reach).
 */
function circleIntersect(
  c0: Point,
  r0: number,
  c1: Point,
  r1: number,
  side: 1 | -1,
): { point: Point; reachable: boolean } {
  const d = dist(c0, c1);
  if (d === 0) return { point: { x: c0.x, y: c0.y + r0 }, reachable: false };
  if (d > r0 + r1 || d < Math.abs(r0 - r1)) {
    // Unreachable — place the joint along the line, proportionally.
    const t = clamp(r0 / d, 0, 1);
    return { point: { x: c0.x + (c1.x - c0.x) * t, y: c0.y + (c1.y - c0.y) * t }, reachable: false };
  }
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
  const xm = c0.x + (a * (c1.x - c0.x)) / d;
  const ym = c0.y + (a * (c1.y - c0.y)) / d;
  const ox = (h * (c1.y - c0.y)) / d;
  const oy = (h * (c1.x - c0.x)) / d;
  const p1 = { x: xm + ox, y: ym - oy };
  const p2 = { x: xm - ox, y: ym + oy };
  const point = (side === 1 ? (p1.y >= p2.y ? p1 : p2) : p1.y < p2.y ? p1 : p2);
  return { point, reachable: true };
}

/** Included angle (deg) at vertex `b` formed by points a-b-c. */
function jointAngle(a: Point, b: Point, c: Point): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (mag === 0) return 0;
  return toDeg(Math.acos(clamp(dot / mag, -1, 1)));
}

/** Estimate leg/torso/arm segments (mm) from height + inseam. */
export function resolveSegments(r: RiderAnthropometrics) {
  const inseam = r.inseam ?? r.height * 0.47;
  const femur = inseam * 0.5;
  const lowerLeg = inseam * 0.5 + r.height * 0.05; // tibia + ankle→pedal allowance
  const torso = r.torsoLength ?? r.height * 0.3;
  const arm = r.armLength ?? r.height * 0.44;
  return { inseam, femur, lowerLeg, torso, arm };
}

/** Back-angle target (deg from horizontal) by flexibility — lower = more aggressive. */
const BACK_TARGET: Record<Flexibility, number> = { low: 52, medium: 45, high: 40 };

/** Sensible default cockpit parameters derived from rider + bike geometry. */
export function deriveDefaultFit(
  rider: RiderAnthropometrics,
  geo: BikeGeometry,
): FitParameters {
  const { inseam } = resolveSegments(rider);
  const saddleHeight = Math.round(inseam * 0.883);
  const saddleSetback = Math.round(saddleHeight * Math.cos((geo.seatTubeAngle * Math.PI) / 180));
  // Cockpit point from frame stack/reach + stem + a default 25mm spacer stack.
  const hta = (geo.headTubeAngle * Math.PI) / 180;
  const spacer = 25;
  const topX = geo.reach - spacer * Math.cos(hta);
  const topY = geo.stack + spacer * Math.sin(hta);
  const stemDir = Math.PI / 2 - hta; // ~horizontal-forward
  const handlebarReach = Math.round(topX + geo.stemLength * Math.cos(stemDir));
  const handlebarHeight = Math.round(topY + geo.stemLength * Math.sin(stemDir));
  return {
    saddleHeight,
    saddleSetback,
    saddleTilt: 0,
    handlebarReach,
    handlebarHeight,
    stemAngle: -6,
    crankLength: geo.crankLength,
  };
}

/**
 * Core fit computation. Pure function — no side effects, no hardcoded frame
 * numbers (geometry only enters via `crankLength` here; cockpit comes from the
 * adjustable parameters).
 */
export function calculateFit(rider: RiderAnthropometrics, p: FitParameters): FitResult {
  const seg = resolveSegments(rider);
  const warnings: FitWarning[] = [];

  // Hip joint ≈ saddle contact.
  const setback = clamp(p.saddleSetback, -40, p.saddleHeight - 1);
  const hip: Point = {
    x: -setback,
    y: Math.sqrt(Math.max(1, p.saddleHeight * p.saddleHeight - setback * setback)),
  };

  // Hand ≈ bar contact.
  const hand: Point = { x: p.handlebarReach, y: p.handlebarHeight };

  // --- Leg, bottom of stroke (knee angle / extension) ---
  const ankleBottom: Point = { x: 0, y: -p.crankLength };
  const legReach = dist(hip, ankleBottom);
  const kneeBottomSol = circleIntersect(hip, seg.femur, ankleBottom, seg.lowerLeg, 1);
  const kneeBottom = kneeBottomSol.point;
  const kneeAngle = Math.round(jointAngle(hip, kneeBottom, ankleBottom));

  if (!kneeBottomSol.reachable && legReach > seg.femur + seg.lowerLeg) {
    warnings.push({
      severity: 'critical',
      field: 'knee',
      message: 'Saddle is too high — the leg over-extends at the bottom of the stroke.',
    });
  }

  // --- Leg, top of stroke (hip angle uses the closed-hip position) ---
  const ankleTop: Point = { x: 0, y: p.crankLength };
  const kneeTop = circleIntersect(hip, seg.femur, ankleTop, seg.lowerLeg, 1).point;

  // --- Torso + arm linkage (shoulder solve) ---
  const shoulderSol = circleIntersect(hip, seg.torso, hand, seg.arm, 1);
  const shoulder = shoulderSol.point;
  const head: Point = {
    x: shoulder.x + seg.torso * 0.16,
    y: shoulder.y + seg.torso * 0.28,
  };

  // --- Angles ---
  const backVec = { x: shoulder.x - hip.x, y: shoulder.y - hip.y };
  const backAngle = Math.round(Math.abs(toDeg(Math.atan2(backVec.y, backVec.x))));
  const hipAngle = Math.round(jointAngle(shoulder, hip, kneeTop));
  const reach = Math.round(hand.x - hip.x);

  // --- Warnings (target-based) ---
  if (kneeAngle < 135 && kneeBottomSol.reachable) {
    warnings.push({ severity: 'warning', field: 'knee', message: 'Knee is quite bent at the bottom of the stroke — consider raising the saddle.' });
  } else if (kneeAngle > 150 && kneeBottomSol.reachable) {
    warnings.push({ severity: 'warning', field: 'knee', message: 'Knee is very open — the saddle may be too high.' });
  }

  const backTarget = BACK_TARGET[rider.flexibility];
  if (backAngle < backTarget - 8) {
    warnings.push({ severity: 'warning', field: 'back', message: 'Position is aggressive for your flexibility — this may stress the lower back on long rides.' });
  }
  if (!shoulderSol.reachable && dist(hip, hand) > seg.torso + seg.arm) {
    warnings.push({ severity: 'critical', field: 'reach', message: 'Reach to the bars is too long — the rider is over-stretched.' });
  } else if (reach < seg.torso * 0.55) {
    warnings.push({ severity: 'info', field: 'reach', message: 'Cockpit is short — the position is upright and relaxed.' });
  }
  if (hipAngle < 40) {
    warnings.push({ severity: 'warning', field: 'hip', message: 'Hip angle is very closed at the top of the stroke and may limit power and comfort.' });
  }

  // --- Score: weighted distance from biomechanical targets ---
  const kneePenalty = Math.abs(kneeAngle - 145) * 1.6;
  const backPenalty = Math.abs(backAngle - backTarget) * 1.2;
  const hipPenalty = Math.max(0, 48 - hipAngle) * 1.4;
  const reachPenalty = !shoulderSol.reachable ? 35 : 0;
  const fitScore = clamp(
    Math.round(100 - kneePenalty - backPenalty - hipPenalty - reachPenalty),
    0,
    100,
  );

  return {
    kneeAngle,
    hipAngle,
    backAngle,
    reach,
    saddleHeight: p.saddleHeight,
    saddleSetback: setback,
    joints: { hip, shoulder, hand, head, kneeBottom, ankleBottom, kneeTop },
    fitScore,
    warnings,
  };
}
