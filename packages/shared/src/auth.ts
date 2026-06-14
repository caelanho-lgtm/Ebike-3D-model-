import { z } from 'zod';
import { roleSchema } from './enums.js';

export const signupSchema = z.object({
  tenantName: z.string().min(2).max(120),
  /** URL-safe subdomain/slug used for the public widget + API key scoping. */
  tenantSlug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'must be a lowercase slug'),
  email: z.string().email().max(160),
  password: z.string().min(10).max(200),
  name: z.string().min(1).max(120),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const inviteUserSchema = z.object({
  email: z.string().email().max(160),
  name: z.string().min(1).max(120),
  role: roleSchema.default('fitter'),
  password: z.string().min(10).max(200),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: roleSchema,
  tenantId: z.string(),
  tenantSlug: z.string(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  primaryColor: z.string(),
  logoUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type TenantDto = z.infer<typeof tenantSchema>;

export const tenantSettingsSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex colour')
    .optional(),
  logoUrl: z.string().url().max(500).nullable().optional(),
});
export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
