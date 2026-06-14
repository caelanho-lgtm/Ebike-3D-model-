import { describe, expect, it } from 'vitest';
import {
  clamp,
  seatAngleToSetback,
  setbackToSeatAngle,
  snapToNearest,
  snapToStep,
  solveCockpitPoint,
} from './geometry.js';

describe('clamp', () => {
  it('clamps within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('snapToNearest', () => {
  it('finds nearest option', () => {
    expect(snapToNearest(171, [165, 170, 172.5, 175])).toBe(170);
    expect(snapToNearest(173.9, [165, 170, 172.5, 175])).toBe(175);
  });
});

describe('snapToStep', () => {
  it('snaps and clamps to step grid', () => {
    expect(snapToStep(103, 60, 130, 10)).toBe(100);
    expect(snapToStep(5, 60, 130, 10)).toBe(60);
    expect(snapToStep(200, 60, 130, 10)).toBe(130);
  });
});

describe('setback <-> seat angle round trip', () => {
  it('inverts within tolerance', () => {
    const sh = 720;
    const setback = 205;
    const angle = setbackToSeatAngle(sh, setback);
    const back = seatAngleToSetback(sh, angle);
    expect(back).toBeCloseTo(setback, 4);
    expect(angle).toBeGreaterThan(70);
    expect(angle).toBeLessThan(80);
  });
});

describe('solveCockpitPoint', () => {
  it('produces a forward, raised cockpit point', () => {
    const p = solveCockpitPoint({
      frameStack: 560,
      frameReach: 390,
      headTubeAngle: 73,
      spacerStack: 20,
      stemLength: 100,
      stemAngle: -6,
    });
    // Cockpit must be ahead of the BB and above the frame stack reference.
    expect(p.reach).toBeGreaterThan(390);
    expect(p.stack).toBeGreaterThan(560);
  });

  it('longer stem increases reach', () => {
    const base = solveCockpitPoint({
      frameStack: 560,
      frameReach: 390,
      headTubeAngle: 73,
      spacerStack: 20,
      stemLength: 90,
      stemAngle: 0,
    });
    const longer = solveCockpitPoint({
      frameStack: 560,
      frameReach: 390,
      headTubeAngle: 73,
      spacerStack: 20,
      stemLength: 120,
      stemAngle: 0,
    });
    expect(longer.reach).toBeGreaterThan(base.reach);
  });

  it('more spacers increase stack', () => {
    const low = solveCockpitPoint({
      frameStack: 560,
      frameReach: 390,
      headTubeAngle: 73,
      spacerStack: 0,
      stemLength: 100,
      stemAngle: 0,
    });
    const high = solveCockpitPoint({
      frameStack: 560,
      frameReach: 390,
      headTubeAngle: 73,
      spacerStack: 40,
      stemLength: 100,
      stemAngle: 0,
    });
    expect(high.stack).toBeGreaterThan(low.stack);
  });
});
