/**
 * FitWerx Fit Engine — public API.
 *
 * Pure, dependency-free TypeScript for:
 *  - resolving rider anthropometrics (with estimation of missing segments),
 *  - computing discipline-aware ideal fit coordinates, and
 *  - scoring/ranking candidate bike frames (the AI-driven sizing recommender).
 */

export * from './types.js';
export {
  SEGMENT_RATIOS,
  DISCIPLINE_PROFILES,
  DEFAULT_COMPONENT_CONSTRAINTS,
  AVAILABLE_CRANK_LENGTHS_MM,
} from './constants.js';
export {
  cmToMm,
  resolveMeasurements,
  validateMeasurements,
  MeasurementError,
  type ResolvedMeasurements,
} from './anthropometry.js';
export {
  deg2rad,
  rad2deg,
  clamp,
  snapToNearest,
  snapToStep,
  solveCockpitPoint,
  setbackToSeatAngle,
  seatAngleToSetback,
  pointDistance,
} from './geometry.js';
export { computeFit, recommendCrankLength, frameSetback } from './fit.js';
export {
  recommendBikes,
  recommendModel,
  evaluateSize,
} from './recommend.js';

export const FIT_ENGINE_VERSION = '1.0.0';
