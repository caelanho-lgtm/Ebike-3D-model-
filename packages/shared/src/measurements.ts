import { z } from 'zod';
import {
  disciplineSchema,
  experienceSchema,
  flexibilitySchema,
  sexSchema,
  unitSystemSchema,
} from './enums.js';

/**
 * Body measurements as submitted by clients, in **centimetres** (the unit most
 * people measure in). The API converts to millimetres for the fit engine.
 * Only `height` is required.
 */
export const measurementsInputSchema = z.object({
  height: z.number().positive().max(250),
  inseam: z.number().positive().max(130).optional(),
  torso: z.number().positive().max(120).optional(),
  armLength: z.number().positive().max(120).optional(),
  shoulderWidth: z.number().positive().max(80).optional(),
  sitBoneWidth: z.number().positive().max(25).optional(),
  femur: z.number().positive().max(90).optional(),
  lowerLeg: z.number().positive().max(90).optional(),
  footLength: z.number().positive().max(40).optional(),
});
export type MeasurementsInput = z.infer<typeof measurementsInputSchema>;

export const riderProfileSchema = z.object({
  discipline: disciplineSchema,
  flexibility: flexibilitySchema.default('medium'),
  experience: experienceSchema.default('intermediate'),
  age: z.number().int().min(8).max(100).optional(),
  sex: sexSchema.default('unspecified'),
});
export type RiderProfileInput = z.infer<typeof riderProfileSchema>;

export const riderInputSchema = z.object({
  units: unitSystemSchema.default('metric'),
  measurements: measurementsInputSchema,
  profile: riderProfileSchema,
});
export type RiderInputDto = z.infer<typeof riderInputSchema>;
