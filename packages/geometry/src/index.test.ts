import { describe, it, expect } from 'vitest';
import { normalizeGeometryChart, validateGeometryChart, REAL_BIKE_CHARTS } from './index.js';

describe('@dtf/geometry — real bike fixtures', () => {
  it('ships at least 3 real geometries', () => {
    expect(REAL_BIKE_CHARTS.length).toBeGreaterThanOrEqual(3);
  });

  it('every fixture validates clean and normalizes', () => {
    for (const chart of REAL_BIKE_CHARTS) {
      expect(validateGeometryChart(chart), `${chart.brand} ${chart.model}`).toEqual([]);

      const bike = normalizeGeometryChart(chart);
      // BB-anchored, sane SI ranges.
      expect(bike.points.bottomBracket).toEqual({ x: 0, y: 0 });
      expect(bike.points.rearAxle.x).toBeLessThan(0);
      expect(bike.points.frontAxle.x).toBeGreaterThan(0);
      expect(bike.points.headTubeTop.y).toBeGreaterThan(0); // above the BB
      expect(bike.reach).toBeGreaterThan(0.1);
      expect(bike.reach).toBeLessThan(0.7);
      expect(bike.wheelRadius).toBeGreaterThan(0.25);
      expect(bike.wheelRadius).toBeLessThan(0.42);
    }
  });

  it('produces unique ids across fixtures', () => {
    const ids = REAL_BIKE_CHARTS.map((c) => normalizeGeometryChart(c).id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
