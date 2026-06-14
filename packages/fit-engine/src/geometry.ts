/** Pure geometric helpers for frame & cockpit math. */

export const deg2rad = (d: number): number => (d * Math.PI) / 180;
export const rad2deg = (r: number): number => (r * 180) / Math.PI;

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** Round to the nearest value in a sorted list. */
export function snapToNearest(value: number, options: readonly number[]): number {
  let best = options[0];
  let bestDist = Math.abs(value - best);
  for (const o of options) {
    const d = Math.abs(value - o);
    if (d < bestDist) {
      best = o;
      bestDist = d;
    }
  }
  return best;
}

/** Round to nearest multiple of `step`, clamped to [min, max]. */
export function snapToStep(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  const clamped = clamp(value, min, max);
  const snapped = Math.round((clamped - min) / step) * step + min;
  return clamp(snapped, min, max);
}

/**
 * Cockpit point produced by a frame's stack/reach plus a steerer spacer stack
 * and a stem. Returns the horizontal (reach) and vertical (stack) position of
 * the handlebar clamp relative to the bottom bracket.
 *
 * Model:
 *   - The head tube is inclined at `headTubeAngle` from horizontal.
 *   - Spacers + the stem clamp height sit along the steerer (same angle).
 *   - The stem extends `stemLength` at `stemAngle` measured from the steerer's
 *     perpendicular (positive = upward rise).
 *
 * This is the standard planar approximation used by fit calculators; it is
 * accurate to a few mm versus full CAD for typical geometries.
 */
export function solveCockpitPoint(params: {
  frameStack: number;
  frameReach: number;
  headTubeAngle: number;
  spacerStack: number;
  /** Stack height of the stem clamp itself (steerer length consumed), mm. */
  stemClampHeight?: number;
  stemLength: number;
  stemAngle: number;
}): { stack: number; reach: number } {
  const {
    frameStack,
    frameReach,
    headTubeAngle,
    spacerStack,
    stemClampHeight = 40,
    stemLength,
    stemAngle,
  } = params;

  const hta = deg2rad(headTubeAngle);
  // Top of head tube is the frame stack/reach point. Spacers + stem clamp rise
  // along the steerer axis (perpendicular-ish to ground at the HT angle).
  const alongSteerer = spacerStack + stemClampHeight / 2;
  const topX = frameReach - alongSteerer * Math.cos(hta);
  const topY = frameStack + alongSteerer * Math.sin(hta);

  // Stem extends forward, perpendicular to the steerer axis, tilted by
  // `stemAngle`. The steerer "up" direction makes angle (180° − HTA) with +x;
  // rotating −90° to point forward gives (90° − HTA). A positive stemAngle adds
  // rise. For a 73° head tube a 0° stem therefore rises ~17° above horizontal.
  const steererPerp = Math.PI / 2 - hta;
  const dir = steererPerp + deg2rad(stemAngle);
  const stemX = topX + stemLength * Math.cos(dir);
  const stemY = topY + stemLength * Math.sin(dir);

  return { reach: stemX, stack: stemY };
}

/**
 * Saddle setback → effective seat-tube angle, given saddle height.
 * setback = saddleHeight * cos(effectiveAngle); larger setback ⇒ slacker angle.
 */
export function setbackToSeatAngle(saddleHeight: number, setback: number): number {
  const ratio = clamp(setback / saddleHeight, -0.5, 0.5);
  return rad2deg(Math.acos(ratio));
}

/** Inverse of `setbackToSeatAngle`. */
export function seatAngleToSetback(saddleHeight: number, seatAngle: number): number {
  return saddleHeight * Math.cos(deg2rad(seatAngle));
}

/** Euclidean distance between two stack/reach points. */
export function pointDistance(
  a: { stack: number; reach: number },
  b: { stack: number; reach: number },
): number {
  return Math.hypot(a.stack - b.stack, a.reach - b.reach);
}
