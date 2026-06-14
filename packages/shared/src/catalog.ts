import { z } from 'zod';
import { disciplineSchema } from './enums.js';

/** Frame geometry size (mm / degrees). */
export const frameGeometrySchema = z.object({
  sizeLabel: z.string().min(1).max(12),
  stack: z.number().min(300).max(800),
  reach: z.number().min(250).max(550),
  seatTubeAngle: z.number().min(68).max(82),
  headTubeAngle: z.number().min(65).max(80),
  headTubeLength: z.number().min(60).max(320).optional(),
  topTube: z.number().min(400).max(700).optional(),
  standover: z.number().min(600).max(950).optional(),
  wheelbase: z.number().min(900).max(1300).optional(),
  stockCrankLength: z.number().min(150).max(185).optional(),
  riderHeightMin: z.number().min(1200).max(2300).optional(),
  riderHeightMax: z.number().min(1200).max(2300).optional(),
});
export type FrameGeometryDto = z.infer<typeof frameGeometrySchema>;

export const bikeModelInputSchema = z.object({
  brand: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  discipline: disciplineSchema,
  description: z.string().max(2000).optional(),
  msrpCents: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().max(500).optional(),
  active: z.boolean().default(true),
  sizes: z.array(frameGeometrySchema).min(1).max(20),
});
export type BikeModelInput = z.infer<typeof bikeModelInputSchema>;

export const bikeModelSchema = bikeModelInputSchema.extend({
  id: z.string(),
  tenantId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BikeModelDto = z.infer<typeof bikeModelSchema>;

/** Adjustable component envelope a fitter can override per session. */
export const componentConstraintsSchema = z.object({
  stemLengthMin: z.number().min(40).max(160).default(60),
  stemLengthMax: z.number().min(40).max(160).default(130),
  stemLengthStep: z.number().min(5).max(20).default(10),
  stemAngleMin: z.number().min(-30).max(0).default(-17),
  stemAngleMax: z.number().min(0).max(30).default(17),
  spacerMin: z.number().min(0).max(60).default(0),
  spacerMax: z.number().min(0).max(80).default(40),
  setbackOptions: z.array(z.number().min(0).max(40)).default([0, 15, 25]),
});
export type ComponentConstraintsDto = z.infer<typeof componentConstraintsSchema>;
