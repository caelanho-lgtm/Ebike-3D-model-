import { resolveMeasurements } from './anthropometry.js';
import {
  AVAILABLE_CRANK_LENGTHS_MM,
  CRANK_INSEAM_FACTOR,
  DISCIPLINE_PROFILES,
  EXPERIENCE_DROP_SCALE,
  FLEXIBILITY_DROP_SCALE,
  LEMOND_SADDLE_FACTOR,
} from './constants.js';
import { clamp, deg2rad, seatAngleToSetback, snapToNearest } from './geometry.js';
import type { FitCoordinates, RiderInput } from './types.js';

/**
 * Map a measured sit-bone width to a recommended saddle width.
 * Saddles are typically ~25–35mm wider than the sit-bone centre-to-centre
 * spacing to support the ischial tuberosities.
 */
function saddleWidthFromSitBones(sitBoneWidth: number): number {
  return Math.round((sitBoneWidth + 30) / 5) * 5;
}

/**
 * Recommend crank length from inseam, snapped to a commercially available size.
 */
export function recommendCrankLength(inseamMm: number): number {
  const ideal = inseamMm * CRANK_INSEAM_FACTOR;
  return snapToNearest(ideal, AVAILABLE_CRANK_LENGTHS_MM);
}

/**
 * Compute the rider's discipline-aware ideal fit coordinates.
 *
 * Pipeline:
 *  1. Resolve/estimate anthropometrics.
 *  2. Saddle height via LeMond factor with a small crank-length correction.
 *  3. Saddle setback from femur length (KOPS-neutral) + discipline bias,
 *     converted to an effective seat angle.
 *  4. Handlebar reach from torso + arm reach geometry and discipline reach factor.
 *  5. Saddle→bar drop scaled by discipline, flexibility, experience and age.
 *  6. Target frame stack & reach derived from the contact points.
 */
export function computeFit(input: RiderInput): {
  fit: FitCoordinates;
  estimatedFields: string[];
} {
  const { measurements: m, estimated } = resolveMeasurements(input.measurements);
  const profile = input.profile;
  const dp = DISCIPLINE_PROFILES[profile.discipline];

  // --- Saddle height (BB → saddle top along seat tube) ---
  const crankLength = recommendCrankLength(m.inseam);
  // Base LeMond height; longer cranks effectively raise the foot at BDC, so we
  // subtract part of the crank delta from a 170mm reference.
  const crankCorrection = (crankLength - 170) * 0.5;
  const saddleHeight = Math.round(
    m.inseam * LEMOND_SADDLE_FACTOR - crankCorrection,
  );

  // --- Effective seat angle & saddle setback ---
  // We target the discipline's nominal seat-tube angle, nudged by femur length
  // (a longer-than-average femur for the rider's height slackens the angle to
  // keep the knee over the pedal). Saddle setback is then the horizontal BB→
  // saddle distance implied by that angle, kept on a like-for-like basis with
  // frame geometry (`frameSetback`).
  const femurRatio = m.femur / m.height; // ~0.245 nominal
  const femurAdjust = (femurRatio - 0.245) * 60; // deg per unit ratio deviation
  const effectiveSeatAngle = clamp(dp.seatAngle - femurAdjust, 70, 80);
  const saddleSetback = seatAngleToSetback(saddleHeight, effectiveSeatAngle);

  // --- Handlebar reach (BB → bar centre, horizontal) ---
  // Driven by an upper-body reach index (torso + half arm), calibrated so a
  // ~1.80 m road rider lands near 475 mm, then scaled by the discipline.
  const upperBodyReach = m.torso + 0.5 * m.armLength;
  const handlebarReach = Math.round(upperBodyReach * 0.51 * dp.reachFactor);

  // --- Saddle → bar drop ---
  const dropScale =
    FLEXIBILITY_DROP_SCALE[profile.flexibility] *
    EXPERIENCE_DROP_SCALE[profile.experience];
  let handlebarDrop = saddleHeight * dp.dropFactor * dropScale;
  if (profile.age && profile.age > 50) {
    // Reduce aggressive drop ~1.5% per year over 50, floor at 40% retained.
    const reduction = clamp(1 - (profile.age - 50) * 0.015, 0.4, 1);
    handlebarDrop *= reduction;
  }
  handlebarDrop = Math.round(handlebarDrop);

  // --- Contact widths ---
  const handlebarWidth = Math.round((m.shoulderWidth + dp.barWidthBias) / 10) * 10;
  const saddleWidth = saddleWidthFromSitBones(m.sitBoneWidth);

  // --- Target frame stack & reach (bar centre relative to the BB) ---
  // Saddle top sits `saddleHeight` up the seat tube at `effectiveSeatAngle`;
  // its vertical height above the BB is saddleHeight·sin(angle). The bar centre
  // is `handlebarDrop` below that, and `handlebarReach` ahead of the BB.
  const saddleTopY = saddleHeight * Math.sin(deg2rad(effectiveSeatAngle));
  const barCentreY = saddleTopY - handlebarDrop;
  const targetStack = Math.round(barCentreY);
  const targetReach = Math.round(handlebarReach);

  return {
    fit: {
      saddleHeight,
      saddleSetback: Math.round(saddleSetback),
      crankLength,
      handlebarReach,
      handlebarDrop,
      handlebarWidth,
      saddleWidth,
      targetStack,
      targetReach,
      effectiveSeatAngle: Math.round(effectiveSeatAngle * 10) / 10,
    },
    estimatedFields: estimated,
  };
}

/** Convenience: setback implied by a frame's seat-tube angle at saddle height. */
export function frameSetback(saddleHeight: number, seatTubeAngle: number): number {
  return seatAngleToSetback(saddleHeight, seatTubeAngle);
}
