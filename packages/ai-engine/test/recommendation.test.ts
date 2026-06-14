import { describe, expect, it } from "vitest";
import { recommendBikeSize } from "../src/index.js";

describe("recommendBikeSize", () => {
  it("returns deterministic recommendation and ranking", () => {
    const result = recommendBikeSize(
      {
        inseamCm: 82,
        torsoCm: 60,
        armCm: 63,
        heightCm: 178,
        flexibilityScore: 6,
        discipline: "road"
      },
      [
        { frameLabel: "52", stackMm: 545, reachMm: 379, topTubeMm: 535 },
        { frameLabel: "54", stackMm: 562, reachMm: 387, topTubeMm: 548 },
        { frameLabel: "56", stackMm: 578, reachMm: 395, topTubeMm: 561 }
      ]
    );

    expect(result.recommendedFrame).toBe("54");
    expect(result.rankedOptions).toHaveLength(3);
    expect(result.confidence).toBeGreaterThan(40);
  });
});
