import {
  DEFAULT_SIT_BONE_WIDTH_MM,
  SEGMENT_RATIOS,
} from './constants.js';
import type { RiderMeasurements } from './types.js';

/** A measurements object with every segment populated. */
export type ResolvedMeasurements = Required<RiderMeasurements>;

export class MeasurementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MeasurementError';
  }
}

/** Convert centimetre body measurements to the engine's millimetre internals. */
export function cmToMm<T extends Record<string, number | undefined>>(input: T): T {
  const out = {} as T;
  for (const key of Object.keys(input) as (keyof T)[]) {
    const v = input[key];
    out[key] = (typeof v === 'number' ? v * 10 : v) as T[keyof T];
  }
  return out;
}

/**
 * Validate raw measurements. Throws `MeasurementError` for physically
 * implausible inputs so we never produce a dangerous fit recommendation.
 */
export function validateMeasurements(m: RiderMeasurements): void {
  if (!Number.isFinite(m.height)) {
    throw new MeasurementError('height is required and must be a finite number (mm).');
  }
  if (m.height < 1200 || m.height > 2300) {
    throw new MeasurementError(
      `height ${m.height}mm is outside the supported range 1200–2300mm.`,
    );
  }
  const checks: Array<[keyof RiderMeasurements, number, number]> = [
    ['inseam', 500, 1200],
    ['torso', 350, 900],
    ['armLength', 400, 1000],
    ['shoulderWidth', 280, 600],
    ['sitBoneWidth', 80, 200],
    ['femur', 300, 700],
    ['lowerLeg', 300, 700],
    ['footLength', 180, 360],
  ];
  for (const [field, min, max] of checks) {
    const v = m[field];
    if (v === undefined) continue;
    if (!Number.isFinite(v) || v < min || v > max) {
      throw new MeasurementError(
        `${String(field)} ${v}mm is implausible (expected ${min}–${max}mm).`,
      );
    }
  }
  if (m.inseam !== undefined && m.inseam > m.height * 0.62) {
    throw new MeasurementError('inseam cannot exceed 62% of height.');
  }
}

/**
 * Resolve a partial measurement set into a full one, estimating missing
 * segments from height-proportional anthropometric regressions.
 *
 * @returns the resolved measurements plus the list of fields that were
 *          estimated rather than measured.
 */
export function resolveMeasurements(m: RiderMeasurements): {
  measurements: ResolvedMeasurements;
  estimated: string[];
} {
  validateMeasurements(m);
  const estimated: string[] = [];
  const h = m.height;

  const fill = (
    field: keyof RiderMeasurements,
    estimate: number,
  ): number => {
    const provided = m[field];
    if (typeof provided === 'number') return provided;
    estimated.push(field as string);
    return Math.round(estimate);
  };

  const measurements: ResolvedMeasurements = {
    height: h,
    inseam: fill('inseam', h * SEGMENT_RATIOS.inseam),
    torso: fill('torso', h * SEGMENT_RATIOS.torso),
    armLength: fill('armLength', h * SEGMENT_RATIOS.armLength),
    shoulderWidth: fill('shoulderWidth', h * SEGMENT_RATIOS.shoulderWidth),
    sitBoneWidth: fill('sitBoneWidth', DEFAULT_SIT_BONE_WIDTH_MM),
    femur: fill('femur', h * SEGMENT_RATIOS.femur),
    lowerLeg: fill('lowerLeg', h * SEGMENT_RATIOS.lowerLeg),
    footLength: fill('footLength', h * SEGMENT_RATIOS.footLength),
  };

  return { measurements, estimated };
}
