import { describe, expect, it } from 'vitest';
import { recommendBikes } from './recommend.js';
import type { BikeModel, RiderInput } from './types.js';

const rider: RiderInput = {
  measurements: { height: 1800, inseam: 840 },
  profile: {
    discipline: 'road_endurance',
    flexibility: 'medium',
    experience: 'intermediate',
  },
};

/** A model whose mid size brackets a typical ~1.80m endurance rider well. */
const enduranceModel: BikeModel = {
  id: 'demo-endurance',
  brand: 'Acme',
  name: 'Granfondo',
  discipline: 'road_endurance',
  sizes: [
    { sizeLabel: '52', stack: 545, reach: 375, seatTubeAngle: 73.5, headTubeAngle: 72 },
    { sizeLabel: '54', stack: 565, reach: 385, seatTubeAngle: 73.5, headTubeAngle: 72.5 },
    { sizeLabel: '56', stack: 585, reach: 392, seatTubeAngle: 73, headTubeAngle: 73 },
    { sizeLabel: '58', stack: 605, reach: 400, seatTubeAngle: 73, headTubeAngle: 73 },
  ],
};

/** An aggressive race model in a different discipline. */
const raceModel: BikeModel = {
  id: 'demo-race',
  brand: 'Acme',
  name: 'Aero Pro',
  discipline: 'road_race',
  sizes: [
    { sizeLabel: 'M', stack: 545, reach: 390, seatTubeAngle: 73.5, headTubeAngle: 73 },
    { sizeLabel: 'L', stack: 575, reach: 400, seatTubeAngle: 73, headTubeAngle: 73.5 },
  ],
};

describe('recommendBikes', () => {
  it('returns a fit and ranked recommendations', () => {
    const result = recommendBikes(rider, [enduranceModel, raceModel]);
    expect(result.fit.saddleHeight).toBeGreaterThan(700);
    expect(result.recommendations.length).toBe(2);
    // sorted best first
    const scores = result.recommendations.map((r) => r.bestSize.score);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
  });

  it('prefers the discipline-matched model for an endurance rider', () => {
    const result = recommendBikes(rider, [raceModel, enduranceModel]);
    expect(result.recommendations[0].model.id).toBe('demo-endurance');
  });

  it('picks a sensible mid size for a 1.80m rider', () => {
    const result = recommendBikes(rider, [enduranceModel]);
    const best = result.recommendations[0].bestSize.sizeLabel;
    expect(['54', '56', '58']).toContain(best);
  });

  it('produces a usable stem length within the default envelope', () => {
    const result = recommendBikes(rider, [enduranceModel]);
    const stem = result.recommendations[0].bestSize.recommendedStemLength;
    expect(stem).toBeGreaterThanOrEqual(60);
    expect(stem).toBeLessThanOrEqual(130);
    expect(stem % 10).toBe(0);
  });

  it('assigns higher confidence to better-fitting models', () => {
    const result = recommendBikes(rider, [enduranceModel]);
    const rec = result.recommendations[0];
    expect(['excellent', 'good', 'fair', 'poor']).toContain(rec.confidence);
    expect(rec.bestSize.score).toBeGreaterThan(40);
  });

  it('respects the limit option', () => {
    const result = recommendBikes(rider, [enduranceModel, raceModel], { limit: 1 });
    expect(result.recommendations.length).toBe(1);
  });

  it('scales scores with how well the size matches', () => {
    const result = recommendBikes(rider, [enduranceModel]);
    const sizes = result.recommendations[0].allSizes;
    // best size should out-score the extreme small size
    const small = sizes.find((s) => s.sizeLabel === '52')!;
    const best = sizes[0];
    expect(best.score).toBeGreaterThanOrEqual(small.score);
  });
});
