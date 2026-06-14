/**
 * Quality windows (comfort/power bands) for fit metrics.
 *
 * SINGLE SOURCE OF TRUTH for every band in the product: HUD colors and the AI
 * Coach both read from here (CLAUDE.md → Coordinate + biomechanics reference).
 * Angles in degrees at the display boundary; the engine works in radians/SI.
 *
 * SCAFFOLD: seed values mirror the prototype's tuned ranges. Expand into the
 * full metric set in the Fit-engine slice; any change here must update the
 * golden fixtures in the same PR.
 */

export interface QualityWindow {
  /** Inclusive lower bound of the "good" band. */
  readonly min: number;
  /** Inclusive upper bound of the "good" band. */
  readonly max: number;
  readonly unit: 'deg' | 'mm';
}

export const WINDOWS = {
  /** Knee extension at bottom dead centre (hip–knee–ankle interior angle). */
  kneeExtension: { min: 136, max: 150, unit: 'deg' },
  /** Torso angle from horizontal. */
  torsoAngle: { min: 40, max: 58, unit: 'deg' },
} as const satisfies Record<string, QualityWindow>;

export type WindowName = keyof typeof WINDOWS;

export type WindowStatus = 'low' | 'ok' | 'high';

/** Classify a value against a named window. Pure + deterministic. */
export function classify(name: WindowName, value: number): WindowStatus {
  const w = WINDOWS[name];
  if (value < w.min) return 'low';
  if (value > w.max) return 'high';
  return 'ok';
}
