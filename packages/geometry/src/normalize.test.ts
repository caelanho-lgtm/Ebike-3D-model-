import { describe, it, expect } from 'vitest';
import { normalizeGeometryChart, slugify } from './normalize.js';
import { degToRad } from './units.js';
import { NORCO_SIGHT_VLT } from './fixtures.js';

describe('slugify', () => {
  it('builds a deterministic, url-safe id', () => {
    expect(slugify('Norco', 'Sight VLT', 'M')).toBe('norco-sight-vlt-m');
    expect(slugify('Specialized', 'Tarmac SL7', '56')).toBe('specialized-tarmac-sl7-56');
  });
});

describe('normalizeGeometryChart — Norco Sight VLT (golden)', () => {
  const bike = normalizeGeometryChart(NORCO_SIGHT_VLT);

  it('converts scalars to SI (metres / radians)', () => {
    expect(bike.id).toBe('norco-sight-vlt-m');
    expect(bike.reach).toBeCloseTo(0.4975, 6);
    expect(bike.stack).toBeCloseTo(0.645, 6);
    expect(bike.headTubeAngle).toBeCloseTo(degToRad(64), 9);
    expect(bike.seatTubeAngle).toBeCloseTo(degToRad(77.75), 9);
    expect(bike.wheelRadius).toBeCloseTo(0.37, 6); // bbHeight + bbDrop
  });

  // These reproduce the constants hard-coded in docs/prototype.html.
  it('derives the prototype frame anchor points', () => {
    expect(bike.points.bottomBracket).toEqual({ x: 0, y: 0 });
    expect(bike.points.rearAxle.x).toBeCloseTo(-0.43911, 4);
    expect(bike.points.rearAxle.y).toBeCloseTo(0.028, 6);
    expect(bike.points.frontAxle.x).toBeCloseTo(0.84189, 4); // prototype FRONT_X ≈ 0.842
    expect(bike.points.frontAxle.y).toBeCloseTo(0.028, 6);
    expect(bike.points.headTubeTop).toEqual({ x: 0.4975, y: 0.645 });
    expect(bike.points.headTubeBottom.x).toBeCloseTo(0.5523, 4);
    expect(bike.points.headTubeBottom.y).toBeCloseTo(0.53265, 4);
    expect(bike.points.seatTubeAxis.x).toBeCloseTo(-0.21217, 4);
    expect(bike.points.seatTubeAxis.y).toBeCloseTo(0.9772, 4);
  });

  it('omits optional fields that are absent from the chart', () => {
    expect(bike.topTubeEffective).toBeUndefined();
    expect(bike.forkRake).toBeUndefined();
  });
});

describe('normalizeGeometryChart — optional fields', () => {
  it('carries optional fields through in SI when present', () => {
    const bike = normalizeGeometryChart({
      ...NORCO_SIGHT_VLT,
      topTubeEffective: 620,
      forkRake: 44,
    });
    expect(bike.topTubeEffective).toBeCloseTo(0.62, 6);
    expect(bike.forkRake).toBeCloseTo(0.044, 6);
  });
});
