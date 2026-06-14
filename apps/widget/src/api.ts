import { z } from "zod";

const recommendationSchema = z.object({
  recommendedFrame: z.string(),
  confidence: z.number(),
  rankedOptions: z.array(
    z.object({
      frameLabel: z.string(),
      fitScore: z.number()
    })
  )
});

export type Recommendation = z.infer<typeof recommendationSchema>;

const apiResponseSchema = z.object({
  embedToken: z.string(),
  recommendation: recommendationSchema
});

export interface WidgetSizingInput {
  bikeModelId: string;
  riderProfile: {
    inseamCm: number;
    torsoCm: number;
    armCm: number;
    heightCm: number;
    flexibilityScore: number;
    discipline: "road" | "gravel" | "mtb" | "triathlon";
  };
}

export async function requestRecommendation(input: WidgetSizingInput): Promise<Recommendation> {
  const endpoint = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
  const apiKey = import.meta.env.VITE_EMBED_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_EMBED_API_KEY is required");
  }

  const response = await fetch(`${endpoint}/v1/embed/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-embed-api-key": apiKey
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Sizing request failed with status ${response.status}`);
  }

  const parsed = apiResponseSchema.parse(await response.json());
  return parsed.recommendation;
}
