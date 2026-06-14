import { describe, expect, it } from 'vitest';
import { toEngineRider } from './convert.js';

describe('toEngineRider', () => {
  it('converts metric cm to mm', () => {
    const r = toEngineRider({
      units: 'metric',
      measurements: { height: 180, inseam: 84 },
      profile: { discipline: 'road_race', flexibility: 'medium', experience: 'advanced', sex: 'unspecified' },
    });
    expect(r.measurements.height).toBe(1800);
    expect(r.measurements.inseam).toBe(840);
    expect(r.measurements.torso).toBeUndefined();
  });

  it('converts imperial inches to mm', () => {
    const r = toEngineRider({
      units: 'imperial',
      measurements: { height: 70 },
      profile: { discipline: 'gravel', flexibility: 'low', experience: 'beginner', sex: 'male' },
    });
    // 70in * 25.4 = 1778mm
    expect(r.measurements.height).toBe(1778);
  });
});
