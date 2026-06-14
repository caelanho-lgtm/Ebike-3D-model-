/**
 * @dtf/fit-core — the deterministic biomechanics engine.
 *
 * NON-NEGOTIABLE (CLAUDE.md): pure + deterministic, framework-free, no Three.js.
 * Same input → same output, in the browser AND on the server. The public
 * surface is `solve(rider, bike, adjustments) => FitState`.
 *
 * SCAFFOLD: only the quality windows exist so far. Port the IK + biomechanics
 * solver from docs/prototype.html in the Fit-engine slice, tests first.
 */

export const FIT_CORE_PACKAGE = '@dtf/fit-core' as const;

export { WINDOWS, classify } from './windows.js';
export type { QualityWindow, WindowName, WindowStatus } from './windows.js';
