import { randomUUID } from "node:crypto";
import { generateFitRecommendations } from "./fitting-engine";
import { getTenantBikes } from "./tenant-registry";
import type { RiderProfile, SizingDecision, Tenant } from "./types";

export interface SizingAiProvider {
  modelName: string;
  summarize(profile: RiderProfile, decision: Omit<SizingDecision, "aiSummary">): Promise<string>;
}

class DeterministicSizingProvider implements SizingAiProvider {
  modelName = "deterministic-fit-v1";

  async summarize(profile: RiderProfile, decision: Omit<SizingDecision, "aiSummary">): Promise<string> {
    const best = decision.recommendations[0];
    if (!best) {
      return "No frame recommendation could be produced for the selected tenant catalog.";
    }

    return [
      `Best match is ${best.bikeModelName} in ${best.frameLabel} with ${best.confidence} confidence.`,
      `The rider's ${profile.intent} posture and ${profile.category} use case are reflected in the reach, stack, and standover score bands.`,
      `Recommended cockpit setup starts with a ${best.stemLengthMm} mm stem, ${best.handlebarDropMm} mm handlebar drop, and ${best.crankLengthMm} mm cranks.`
    ].join(" ");
  }
}

export function createSizingProvider(): SizingAiProvider {
  return new DeterministicSizingProvider();
}

export async function createSizingDecision(
  tenant: Tenant,
  profile: RiderProfile,
  provider = createSizingProvider()
): Promise<SizingDecision> {
  const tenantBikes = getTenantBikes(tenant.id);
  const recommendations = generateFitRecommendations(profile, tenantBikes, 3);
  const requestId = randomUUID();
  const partialDecision = {
    tenantId: tenant.id,
    generatedAt: new Date().toISOString(),
    recommendations,
    nextBestActions: [
      "Capture email or CRM identity only after sizing value has been shown.",
      "Offer an in-store fit appointment for low-confidence or injury-flagged recommendations.",
      "Pass selected frame, cockpit setup, and tenant ID to ecommerce cart or dealer CRM."
    ],
    audit: {
      requestId,
      model: provider.modelName,
      deterministicFallback: provider.modelName === "deterministic-fit-v1"
    }
  } satisfies Omit<SizingDecision, "aiSummary">;

  return {
    ...partialDecision,
    aiSummary: tenant.featureFlags.aiSizing
      ? await provider.summarize(profile, partialDecision)
      : "AI sizing is disabled for this tenant; recommendations were generated from deterministic geometry rules."
  };
}
