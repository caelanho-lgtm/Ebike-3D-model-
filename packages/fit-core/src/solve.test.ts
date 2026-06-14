import { describe, it, expect } from 'vitest';
import { normalizeGeometryChart, NORCO_SIGHT_VLT, degToRad } from '@dtf/geometry';
import { solve, suggestAdjustments, deriveSegments, metricDisplay } from './solve.js';
import type { RiderMeasurements } from './types.js';

const bike = normalizeGeometryChart(NORCO_SIGHT_VLT);
const rider: RiderMeasurements = { heightM: 1.78, inseamM: 0.83 };

describe('deriveSegments', () => {
  it('splits the leg into thigh + shank summing to functional leg length', () => {
    const seg = deriveSegments(rider);
    expect(seg.thigh + seg.shank).toBeCloseTo(0.83 * 1.13, 9);
    expect(seg.thigh).toBeCloseTo(0.83 * 1.13 * 0.46, 9);
  });
});

describe('suggestAdjustments (ports defaultSaddle)', () => {
  const adj = suggestAdjustments(rider, bike);

  it('targets ~96.5% leg extension at the down pedal', () => {
    expect(adj.saddleHeightM).toBeCloseTo(0.7271, 3);
    expect(adj.stemAngleRad).toBeCloseTo(degToRad(18), 9);
  });

  it('depends on inseam, not height', () => {
    const tall = suggestAdjustments({ heightM: 2.0, inseamM: 0.83 }, bike);
    expect(tall.saddleHeightM).toBeCloseTo(adj.saddleHeightM, 9);
  });
});

describe('solve — Norco Sight VLT, suggested fit (golden)', () => {
  const adj = suggestAdjustments(rider, bike);
  const fit = solve(rider, bike, adj);

  it('reports the tuned saddle/knee outputs from the prototype', () => {
    expect(fit.metrics.saddleHeight.si).toBeCloseTo(0.7271, 3);

    const knee = metricDisplay(fit.metrics.kneeExtension);
    expect(knee.unit).toBe('deg');
    expect(knee.value).toBeCloseTo(149.5, 1);
    expect(fit.metrics.kneeExtension.status).toBe('ok');

    const torso = metricDisplay(fit.metrics.torsoAngle);
    expect(torso.value).toBeGreaterThan(48);
    expect(torso.value).toBeLessThan(51);
    expect(fit.metrics.torsoAngle.status).toBe('ok');

    expect(fit.metrics.barDrop.si).toBeCloseTo(0.0371, 3); // saddle above bar
    expect(fit.metrics.stemReach.si).toBeCloseTo(0.0875, 4);

    expect(fit.warnings).toEqual([]);
  });

  it('places the down-stroke ankle at the prototype crank rig position', () => {
    expect(fit.joints.ankleDown.x).toBeCloseTo(0.035345, 4);
    expect(fit.joints.ankleDown.y).toBeCloseTo(-0.136285, 4);
  });

  it('is deterministic: same input → identical output', () => {
    const again = solve(rider, bike, adj);
    expect(again).toEqual(fit);
  });
});

describe('solve — warnings', () => {
  it('flags an over-extended leg when the saddle is too high', () => {
    const fit = solve(rider, bike, { saddleHeightM: 0.95, stemAngleRad: degToRad(18) });
    expect(fit.warnings.map((w) => w.code)).toContain('leg-over-extended');
    expect(fit.metrics.kneeExtension.status).toBe('high');
  });

  it('flags unreachable bars for a torso that cannot span to the grips', () => {
    // Synthetic short-torso body to exercise the reach path deterministically.
    const tiny: RiderMeasurements = { heightM: 1.0, inseamM: 0.83 };
    const fit = solve(tiny, bike, suggestAdjustments(tiny, bike));
    const codes = fit.warnings.map((w) => w.code);
    expect(codes).toContain('bars-unreachable');
    expect(codes).not.toContain('leg-over-extended');
  });
});

describe('metricDisplay', () => {
  it('converts angles to degrees and lengths to millimetres', () => {
    const fit = solve(rider, bike, suggestAdjustments(rider, bike));
    expect(metricDisplay(fit.metrics.kneeExtension).unit).toBe('deg');
    expect(metricDisplay(fit.metrics.saddleHeight)).toEqual({
      value: expect.closeTo(727.1, 0),
      unit: 'mm',
    });
  });
});
