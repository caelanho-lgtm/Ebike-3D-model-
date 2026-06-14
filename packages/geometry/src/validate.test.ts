import { describe, it, expect } from 'vitest';
import {
  validateGeometryChart,
  assertValidGeometryChart,
  GeometryValidationError,
} from './validate.js';
import { normalizeGeometryChart } from './normalize.js';
import { NORCO_SIGHT_VLT } from './fixtures.js';

describe('validateGeometryChart', () => {
  it('returns no issues for a valid chart', () => {
    expect(validateGeometryChart(NORCO_SIGHT_VLT)).toEqual([]);
  });

  it('flags an out-of-range head-tube angle', () => {
    const issues = validateGeometryChart({ ...NORCO_SIGHT_VLT, headTubeAngle: 40 });
    expect(issues.map((i) => i.field)).toContain('headTubeAngle');
  });

  it('flags an empty brand', () => {
    const issues = validateGeometryChart({ ...NORCO_SIGHT_VLT, brand: '  ' });
    expect(issues.map((i) => i.field)).toContain('brand');
  });

  it('flags a non-finite field', () => {
    const issues = validateGeometryChart({ ...NORCO_SIGHT_VLT, reach: Number.NaN });
    expect(issues.map((i) => i.field)).toContain('reach');
  });

  it('flags a chainstay that cannot resolve the rear axle', () => {
    // chainstay must exceed |bbDrop|; here chainstay is in range but < bbDrop.
    const issues = validateGeometryChart({ ...NORCO_SIGHT_VLT, chainstay: 320, bbDrop: 350 });
    expect(issues.map((i) => i.field)).toContain('chainstay');
  });

  it('flags wheelbase not exceeding chainstay', () => {
    const issues = validateGeometryChart({ ...NORCO_SIGHT_VLT, wheelbase: 1000, chainstay: 1000 });
    expect(issues.map((i) => i.field)).toContain('wheelbase');
  });

  it('flags an inconsistent stated wheel diameter', () => {
    const issues = validateGeometryChart({ ...NORCO_SIGHT_VLT, wheelDiameter: 500 });
    expect(issues.map((i) => i.field)).toContain('wheelDiameter');
  });
});

describe('assertValidGeometryChart / normalize error path', () => {
  it('throws GeometryValidationError carrying the issues', () => {
    const bad = { ...NORCO_SIGHT_VLT, seatTubeAngle: 120 };
    expect(() => assertValidGeometryChart(bad)).toThrowError(GeometryValidationError);
    try {
      normalizeGeometryChart(bad);
      expect.unreachable('normalize should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(GeometryValidationError);
      expect((err as GeometryValidationError).issues.length).toBeGreaterThan(0);
    }
  });
});
