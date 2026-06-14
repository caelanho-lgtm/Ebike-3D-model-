import { describe, expect, it } from "vitest";
import { sizingRequestSchema } from "./schemas";

describe("sizing request schema", () => {
  it("accepts realistic rider measurements with explicit consent", () => {
    const result = sizingRequestSchema.safeParse({
      tenantSlug: "velo-north",
      source: "embed",
      consent: {
        biomechanicsProcessing: true,
        marketingOptIn: false
      },
      profile: {
        measurements: {
          heightMm: 1720,
          inseamMm: 800,
          torsoMm: 590,
          armMm: 630,
          shoulderMm: 410,
          flexibilityScore: 5
        },
        intent: "commute",
        category: "ebike",
        experienceYears: 1
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects processing without explicit biomechanics consent", () => {
    const result = sizingRequestSchema.safeParse({
      tenantSlug: "velo-north",
      consent: {
        biomechanicsProcessing: false,
        marketingOptIn: false
      },
      profile: {
        measurements: {
          heightMm: 1720,
          inseamMm: 800,
          torsoMm: 590,
          armMm: 630,
          shoulderMm: 410,
          flexibilityScore: 5
        },
        intent: "commute",
        category: "ebike",
        experienceYears: 1
      }
    });

    expect(result.success).toBe(false);
  });
});
