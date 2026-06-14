import { describe, expect, it } from 'vitest';
import {
  cmToMm,
  MeasurementError,
  resolveMeasurements,
  validateMeasurements,
} from './anthropometry.js';

describe('cmToMm', () => {
  it('scales numeric fields by 10 and leaves undefined alone', () => {
    expect(cmToMm({ height: 180, inseam: 84, torso: undefined })).toEqual({
      height: 1800,
      inseam: 840,
      torso: undefined,
    });
  });
});

describe('validateMeasurements', () => {
  it('accepts a plausible height', () => {
    expect(() => validateMeasurements({ height: 1800 })).not.toThrow();
  });

  it('rejects missing/NaN height', () => {
    expect(() => validateMeasurements({ height: Number.NaN })).toThrow(MeasurementError);
  });

  it('rejects out-of-range height', () => {
    expect(() => validateMeasurements({ height: 800 })).toThrow(/range/);
    expect(() => validateMeasurements({ height: 2500 })).toThrow(/range/);
  });

  it('rejects implausible inseam relative to height', () => {
    expect(() => validateMeasurements({ height: 1700, inseam: 1100 })).toThrow();
  });

  it('rejects implausible segment values', () => {
    expect(() => validateMeasurements({ height: 1800, footLength: 50 })).toThrow();
  });
});

describe('resolveMeasurements', () => {
  it('estimates all missing segments from height', () => {
    const { measurements, estimated } = resolveMeasurements({ height: 1800 });
    expect(measurements.height).toBe(1800);
    expect(measurements.inseam).toBeGreaterThan(700);
    expect(measurements.inseam).toBeLessThan(950);
    expect(estimated).toContain('inseam');
    expect(estimated).toContain('shoulderWidth');
    expect(estimated.length).toBe(8);
  });

  it('keeps measured values and only estimates the rest', () => {
    const { measurements, estimated } = resolveMeasurements({
      height: 1750,
      inseam: 820,
      shoulderWidth: 410,
    });
    expect(measurements.inseam).toBe(820);
    expect(measurements.shoulderWidth).toBe(410);
    expect(estimated).not.toContain('inseam');
    expect(estimated).not.toContain('shoulderWidth');
    expect(estimated).toContain('torso');
  });
});
