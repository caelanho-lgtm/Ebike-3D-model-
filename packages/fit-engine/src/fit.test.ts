import { describe, expect, it } from 'vitest';
import { computeFit, recommendCrankLength } from './fit.js';
import type { RiderInput } from './types.js';

const baseRider: RiderInput = {
  measurements: { height: 1800, inseam: 840 },
  profile: {
    discipline: 'road_endurance',
    flexibility: 'medium',
    experience: 'intermediate',
  },
};

describe('recommendCrankLength', () => {
  it('snaps to an available length', () => {
    expect(recommendCrankLength(840)).toBe(180); // 840*0.216=181.4 -> 180
    expect(recommendCrankLength(780)).toBe(167.5); // 168.5 -> 167.5
  });
});

describe('computeFit', () => {
  it('computes a plausible saddle height near the LeMond factor', () => {
    const { fit } = computeFit(baseRider);
    // 840 * 0.883 ≈ 742, minus small crank correction.
    expect(fit.saddleHeight).toBeGreaterThan(720);
    expect(fit.saddleHeight).toBeLessThan(750);
  });

  it('reports estimated fields when measurements omitted', () => {
    const { estimatedFields } = computeFit(baseRider);
    expect(estimatedFields).toContain('torso');
    expect(estimatedFields).not.toContain('inseam');
  });

  it('TT/tri produces more drop and more forward setback than endurance', () => {
    const endurance = computeFit(baseRider).fit;
    const tt = computeFit({
      ...baseRider,
      profile: { ...baseRider.profile, discipline: 'tt_triathlon' },
    }).fit;
    expect(tt.handlebarDrop).toBeGreaterThan(endurance.handlebarDrop);
    expect(tt.saddleSetback).toBeLessThan(endurance.saddleSetback);
    expect(tt.effectiveSeatAngle).toBeGreaterThan(endurance.effectiveSeatAngle);
  });

  it('low flexibility reduces drop vs high flexibility', () => {
    const low = computeFit({
      ...baseRider,
      profile: { ...baseRider.profile, flexibility: 'low' },
    }).fit;
    const high = computeFit({
      ...baseRider,
      profile: { ...baseRider.profile, flexibility: 'high' },
    }).fit;
    expect(low.handlebarDrop).toBeLessThan(high.handlebarDrop);
  });

  it('age over 50 reduces aggressive drop', () => {
    const young = computeFit({
      ...baseRider,
      profile: { ...baseRider.profile, discipline: 'road_race', age: 30 },
    }).fit;
    const old = computeFit({
      ...baseRider,
      profile: { ...baseRider.profile, discipline: 'road_race', age: 65 },
    }).fit;
    expect(old.handlebarDrop).toBeLessThan(young.handlebarDrop);
  });

  it('taller riders get longer reach and higher stack targets', () => {
    const small = computeFit({
      measurements: { height: 1600 },
      profile: baseRider.profile,
    }).fit;
    const tall = computeFit({
      measurements: { height: 1950 },
      profile: baseRider.profile,
    }).fit;
    expect(tall.targetReach).toBeGreaterThan(small.targetReach);
    expect(tall.targetStack).toBeGreaterThan(small.targetStack);
    expect(tall.saddleHeight).toBeGreaterThan(small.saddleHeight);
  });

  it('mtb gets wider bars than road', () => {
    const road = computeFit(baseRider).fit;
    const mtb = computeFit({
      ...baseRider,
      profile: { ...baseRider.profile, discipline: 'mtb_trail' },
    }).fit;
    expect(mtb.handlebarWidth).toBeGreaterThan(road.handlebarWidth);
  });
});
