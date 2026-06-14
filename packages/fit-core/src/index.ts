/**
 * @dtf/fit-core — the deterministic biomechanics engine.
 *
 * NON-NEGOTIABLE (CLAUDE.md): pure + deterministic, framework-free, no Three.js.
 * Same input → same output, in the browser AND on the server. The public
 * surface is `solve(rider, bike, adjustments) => FitState`, plus
 * `suggestAdjustments()` for a sensible starting fit.
 */

export const FIT_CORE_PACKAGE = '@dtf/fit-core' as const;

export { WINDOWS, classify } from './windows.js';
export type { QualityWindow, WindowName, WindowStatus } from './windows.js';

export { ANTHRO, RIG } from './model.js';

export {
  solve,
  suggestAdjustments,
  deriveSegments,
  solveTwoBone,
  placeShoulder,
  metricDisplay,
} from './solve.js';

export type {
  RiderMeasurements,
  RiderSegments,
  Adjustments,
  Metric,
  MetricKind,
  FitJoints,
  FitMetrics,
  FitWarning,
  FitWarningCode,
  FitState,
} from './types.js';
