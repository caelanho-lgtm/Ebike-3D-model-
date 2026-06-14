/**
 * Tuned biomechanics + rig constants, ported verbatim from docs/prototype.html
 * (`solvePosture` / `buildBike`). These are the values the golden tests pin; any
 * change here is an engine-output change and must update fixtures in the same PR.
 */

import { degToRad } from '@dtf/geometry';

/** Anthropometric ratios deriving body-segment lengths from measurements. */
export const ANTHRO = {
  /** Functional leg length as a multiple of inseam. */
  legToInseam: 1.13,
  thighOfLeg: 0.46,
  shankOfLeg: 0.54,
  torsoOfHeight: 0.32,
  upperArmOfHeight: 0.18,
  forearmOfHeight: 0.175,
  /** Effective arm reach is slightly less than full extension. */
  armReachFactor: 0.97,
  headRadiusOfHeight: 0.052,
  neckOfHeight: 0.052,
} as const;

/** Rig geometry not carried on CanonicalBike (cockpit + drivetrain). Metres/radians. */
export const RIG = {
  crankLength: 0.17,
  /** Down-stroke crank position (from vertical) at which knee extension is evaluated. */
  crankDownAngleRad: degToRad(12),
  /** Foot/cleat stack: ankle sits this far above the pedal axle. */
  pedalAnkleRise: 0.03,
  /** Hip offset from the saddle nose (world axes, metres). */
  hipOffset: { x: 0.035, y: 0.045 },
  /** Effective stem reach (steerer top → bar) the bar swings on. */
  stemLength: 0.092,
  defaultStemAngleRad: degToRad(18),
  /** suggestAdjustments targets this fraction of full leg extension at the down pedal. */
  saddleExtensionTarget: 0.965,
  /** Search bounds for the suggested saddle height (metres). */
  saddleSearch: { lo: 0.45, hi: 0.95, iterations: 26 },
} as const;
