import { z } from 'zod';
import { componentConstraintsSchema } from './catalog.js';
import { riderInputSchema } from './measurements.js';

/** Request body for a fit + recommendation run. */
export const recommendRequestSchema = z.object({
  rider: riderInputSchema,
  /** Restrict candidate models to these IDs; default = all active models. */
  modelIds: z.array(z.string()).optional(),
  /** Override the adjustable component envelope. */
  constraints: componentConstraintsSchema.partial().optional(),
  /** Max number of ranked models to return. */
  limit: z.number().int().min(1).max(50).optional(),
  /** Persist this run as a FitSession. Requires authentication. */
  persist: z.boolean().default(false),
  /** Optional rider/customer label for persisted sessions. */
  customerName: z.string().max(120).optional(),
  customerEmail: z.string().email().max(160).optional(),
});
export type RecommendRequest = z.infer<typeof recommendRequestSchema>;

/** Fit coordinates returned to clients (mm / deg). */
export const fitCoordinatesSchema = z.object({
  saddleHeight: z.number(),
  saddleSetback: z.number(),
  crankLength: z.number(),
  handlebarReach: z.number(),
  handlebarDrop: z.number(),
  handlebarWidth: z.number(),
  saddleWidth: z.number(),
  targetStack: z.number(),
  targetReach: z.number(),
  effectiveSeatAngle: z.number(),
});
export type FitCoordinatesDto = z.infer<typeof fitCoordinatesSchema>;

export const confidenceSchema = z.enum(['excellent', 'good', 'fair', 'poor']);
export type Confidence = z.infer<typeof confidenceSchema>;

export const sizeFitResultSchema = z.object({
  sizeLabel: z.string(),
  score: z.number(),
  recommendedStemLength: z.number(),
  recommendedStemAngle: z.number(),
  recommendedSpacerStack: z.number(),
  recommendedSetback: z.number(),
  residuals: z.object({
    reachError: z.number(),
    stackError: z.number(),
    setbackError: z.number(),
  }),
  withinAdjustmentRange: z.boolean(),
  notes: z.array(z.string()),
});
export type SizeFitResultDto = z.infer<typeof sizeFitResultSchema>;

export const modelRecommendationSchema = z.object({
  modelId: z.string(),
  brand: z.string(),
  name: z.string(),
  discipline: z.string(),
  imageUrl: z.string().optional(),
  bestSize: sizeFitResultSchema,
  allSizes: z.array(sizeFitResultSchema),
  confidence: confidenceSchema,
});
export type ModelRecommendationDto = z.infer<typeof modelRecommendationSchema>;

export const recommendResponseSchema = z.object({
  fit: fitCoordinatesSchema,
  recommendations: z.array(modelRecommendationSchema),
  estimatedFields: z.array(z.string()),
  sessionId: z.string().optional(),
});
export type RecommendResponse = z.infer<typeof recommendResponseSchema>;
