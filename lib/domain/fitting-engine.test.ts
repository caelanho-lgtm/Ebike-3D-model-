import { describe, expect, it } from "vitest";
import { createSizingDecision } from "./ai-sizing-service";
import { generateFitRecommendations } from "./fitting-engine";
import { getTenantBikes, resolveTenantFromHost, resolveTenantFromSlug } from "./tenant-registry";
import type { RiderProfile } from "./types";

const profile: RiderProfile = {
  measurements: {
    heightMm: 1780,
    inseamMm: 835,
    torsoMm: 620,
    armMm: 660,
    shoulderMm: 430,
    weightKg: 78,
    flexibilityScore: 6
  },
  intent: "endurance",
  category: "road",
  experienceYears: 4
};

describe("tenant registry", () => {
  it("resolves tenants from registered hosts and falls back safely", () => {
    expect(resolveTenantFromHost("velo-north.example.com")?.slug).toBe("velo-north");
    expect(resolveTenantFromHost("unknown.example.com")?.slug).toBe("velo-north");
  });

  it("keeps bike catalogs scoped by tenant", () => {
    const tenant = resolveTenantFromSlug("apex-cycles");
    expect(tenant).toBeDefined();
    expect(getTenantBikes(tenant!.id)).toHaveLength(1);
    expect(getTenantBikes(tenant!.id).every((bike) => bike.tenantId === tenant!.id)).toBe(true);
  });
});

describe("fitting engine", () => {
  it("returns sorted, explainable recommendations", () => {
    const tenant = resolveTenantFromSlug("velo-north")!;
    const recommendations = generateFitRecommendations(profile, getTenantBikes(tenant.id), 3);

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1].score);
    expect(recommendations[0].saddleHeightMm).toBe(Math.round(profile.measurements.inseamMm * 0.883));
    expect(recommendations[0].scoreBreakdown.reach).toBeGreaterThanOrEqual(0);
    expect(recommendations[0].notes.length).toBeGreaterThan(0);
  });

  it("creates audited sizing decisions with deterministic fallback metadata", async () => {
    const tenant = resolveTenantFromSlug("velo-north")!;
    const decision = await createSizingDecision(tenant, profile);

    expect(decision.tenantId).toBe(tenant.id);
    expect(decision.recommendations.length).toBeGreaterThan(0);
    expect(decision.audit.model).toBe("deterministic-fit-v1");
    expect(decision.audit.deterministicFallback).toBe(true);
    expect(decision.aiSummary).toContain(decision.recommendations[0].bikeModelName);
  });
});
