export interface WidgetConfig {
  tenant: string;
  apiKey: string;
  apiBase: string;
  /** Optional discipline lock; otherwise the rider picks. */
  discipline?: string;
}

export interface PublicConfig {
  tenant: { name: string; slug: string; primaryColor: string; logoUrl: string | null };
  disciplines: string[];
  models: Array<{ id: string; brand: string; name: string; discipline: string; imageUrl: string | null; sizeCount: number }>;
}

export interface FitCoordinates {
  saddleHeight: number;
  saddleSetback: number;
  crankLength: number;
  handlebarReach: number;
  handlebarDrop: number;
  handlebarWidth: number;
  saddleWidth: number;
  targetStack: number;
  targetReach: number;
  effectiveSeatAngle: number;
}

export interface SizeFitResult {
  sizeLabel: string;
  score: number;
  recommendedStemLength: number;
  recommendedStemAngle: number;
  recommendedSpacerStack: number;
  withinAdjustmentRange: boolean;
  notes: string[];
}

export interface ModelRecommendation {
  modelId: string;
  brand: string;
  name: string;
  discipline: string;
  imageUrl?: string;
  bestSize: SizeFitResult;
  confidence: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RecommendResponse {
  fit: FitCoordinates;
  recommendations: ModelRecommendation[];
  estimatedFields: string[];
}
