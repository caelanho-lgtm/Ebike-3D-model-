export type TenantPlan = "brand" | "retailer" | "enterprise";

export type RiderIntent =
  | "comfort"
  | "endurance"
  | "performance"
  | "race"
  | "cargo"
  | "commute";

export type BikeCategory =
  | "road"
  | "gravel"
  | "mountain"
  | "hybrid"
  | "cargo"
  | "ebike";

export type FitConfidence = "low" | "medium" | "high";

export interface TenantTheme {
  primary: string;
  accent: string;
  surface: string;
  text: string;
  radius: "soft" | "rounded" | "pill";
}

export interface TenantIntegration {
  allowedOrigins: string[];
  webhookUrl?: string;
  apiKeyHint: string;
  ssoEnabled: boolean;
}

export interface Tenant {
  id: string;
  slug: string;
  displayName: string;
  plan: TenantPlan;
  domains: string[];
  locale: string;
  theme: TenantTheme;
  integration: TenantIntegration;
  featureFlags: {
    aiSizing: boolean;
    threeDimensionalFit: boolean;
    dealerHandoff: boolean;
    whiteLabelEmbeds: boolean;
  };
}

export interface RiderMeasurements {
  heightMm: number;
  inseamMm: number;
  torsoMm: number;
  armMm: number;
  shoulderMm: number;
  weightKg?: number;
  flexibilityScore: number;
}

export interface RiderProfile {
  riderId?: string;
  measurements: RiderMeasurements;
  intent: RiderIntent;
  category: BikeCategory;
  experienceYears: number;
  injuryNotes?: string;
}

export interface BikeModel {
  id: string;
  tenantId: string;
  name: string;
  category: BikeCategory;
  frameSizes: FrameSize[];
}

export interface FrameSize {
  label: string;
  seatTubeMm: number;
  topTubeMm: number;
  stackMm: number;
  reachMm: number;
  standoverMm: number;
  headTubeAngleDeg: number;
  seatTubeAngleDeg: number;
  wheelbaseMm: number;
}

export interface FitScoreBreakdown {
  reach: number;
  stack: number;
  standover: number;
  intent: number;
}

export interface FitRecommendation {
  bikeModelId: string;
  bikeModelName: string;
  frameLabel: string;
  score: number;
  confidence: FitConfidence;
  saddleHeightMm: number;
  handlebarDropMm: number;
  stemLengthMm: number;
  crankLengthMm: number;
  notes: string[];
  scoreBreakdown: FitScoreBreakdown;
}

export interface SizingDecision {
  tenantId: string;
  generatedAt: string;
  recommendations: FitRecommendation[];
  aiSummary: string;
  nextBestActions: string[];
  audit: {
    requestId: string;
    model: string;
    deterministicFallback: boolean;
  };
}
