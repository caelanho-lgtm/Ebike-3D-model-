import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default('dev-only-insecure-secret-change-me-please-0001'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGINS: z.string().default('*'),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(43200),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Ensure downstream consumers that read process.env directly (e.g. the Prisma
// client) observe the resolved values, including defaults applied above.
process.env.DATABASE_URL = env.DATABASE_URL;
process.env.NODE_ENV = env.NODE_ENV;

if (env.NODE_ENV === 'production' && env.JWT_SECRET.startsWith('dev-only')) {
  // eslint-disable-next-line no-console
  console.error('Refusing to start in production with the default JWT_SECRET.');
  process.exit(1);
}

export const corsOrigins =
  env.CORS_ORIGINS === '*'
    ? true
    : env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
