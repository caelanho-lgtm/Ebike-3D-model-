import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().min(1).max(65535).default(8080),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url()
});

export type AppConfig = z.infer<typeof envSchema>;

export function getConfig(): AppConfig {
  return envSchema.parse(process.env);
}
