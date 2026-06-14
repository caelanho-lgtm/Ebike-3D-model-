import { z } from "zod";

export const riderMeasurementsSchema = z.object({
  heightMm: z.number().int().min(1200).max(2300),
  inseamMm: z.number().int().min(550).max(1200),
  torsoMm: z.number().int().min(420).max(850),
  armMm: z.number().int().min(420).max(900),
  shoulderMm: z.number().int().min(280).max(620),
  weightKg: z.number().min(35).max(220).optional(),
  flexibilityScore: z.number().int().min(1).max(10)
});

export const riderProfileSchema = z.object({
  riderId: z.string().min(3).max(120).optional(),
  measurements: riderMeasurementsSchema,
  intent: z.enum(["comfort", "endurance", "performance", "race", "cargo", "commute"]),
  category: z.enum(["road", "gravel", "mountain", "hybrid", "cargo", "ebike"]),
  experienceYears: z.number().int().min(0).max(80),
  injuryNotes: z.string().max(500).optional()
});

export const sizingRequestSchema = z.object({
  tenantSlug: z.string().min(2).max(80),
  profile: riderProfileSchema,
  source: z.enum(["api", "embed", "admin"]).default("api"),
  consent: z.object({
    biomechanicsProcessing: z.literal(true),
    marketingOptIn: z.boolean().default(false)
  })
});

export type SizingRequest = z.infer<typeof sizingRequestSchema>;
