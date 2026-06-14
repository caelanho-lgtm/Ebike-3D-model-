import { z } from 'zod';

export const disciplineSchema = z.enum([
  'road_race',
  'road_endurance',
  'gravel',
  'mtb_xc',
  'mtb_trail',
  'tt_triathlon',
  'commute_city',
]);
export type Discipline = z.infer<typeof disciplineSchema>;

export const flexibilitySchema = z.enum(['low', 'medium', 'high']);
export type Flexibility = z.infer<typeof flexibilitySchema>;

export const experienceSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'pro',
]);
export type Experience = z.infer<typeof experienceSchema>;

export const sexSchema = z.enum(['male', 'female', 'unspecified']);
export type Sex = z.infer<typeof sexSchema>;

export const unitSystemSchema = z.enum(['metric', 'imperial']);
export type UnitSystem = z.infer<typeof unitSystemSchema>;

/** Roles in ascending privilege order within a tenant. */
export const roleSchema = z.enum(['viewer', 'fitter', 'admin', 'owner']);
export type Role = z.infer<typeof roleSchema>;

export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  fitter: 1,
  admin: 2,
  owner: 3,
};
