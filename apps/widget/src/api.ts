import type { PublicConfig, RecommendResponse, WidgetConfig } from './types';

export async function fetchPublicConfig(cfg: WidgetConfig): Promise<PublicConfig> {
  const res = await fetch(`${cfg.apiBase}/v1/public/${encodeURIComponent(cfg.tenant)}/config`);
  if (!res.ok) throw new Error(`Failed to load workspace "${cfg.tenant}" (${res.status})`);
  return res.json();
}

export interface RecommendInput {
  units: 'metric' | 'imperial';
  discipline: string;
  flexibility: 'low' | 'medium' | 'high';
  experience: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  height: number;
  inseam?: number;
  customerName?: string;
  customerEmail?: string;
}

export async function runRecommend(
  cfg: WidgetConfig,
  input: RecommendInput,
): Promise<RecommendResponse> {
  const res = await fetch(`${cfg.apiBase}/v1/fit/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.apiKey },
    body: JSON.stringify({
      rider: {
        units: input.units,
        measurements: { height: input.height, inseam: input.inseam },
        profile: {
          discipline: input.discipline,
          flexibility: input.flexibility,
          experience: input.experience,
          sex: 'unspecified',
        },
      },
      persist: true,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      limit: 5,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Fit request failed (${res.status})`);
  }
  return data as RecommendResponse;
}
