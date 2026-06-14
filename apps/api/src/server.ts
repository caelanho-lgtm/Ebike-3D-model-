import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { ERROR_CODES, type ApiError } from '@fitwerx/shared';
import { corsOrigins, env } from './env.js';
import { HttpError } from './http.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { tenantRoutes } from './routes/tenant.js';
import { catalogRoutes } from './routes/catalog.js';
import { fitRoutes } from './routes/fit.js';
import { publicRoutes } from './routes/public.js';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: env.NODE_ENV === 'development' ? 'info' : 'warn',
            transport:
              env.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } }
                : undefined,
          },
    trustProxy: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });
  await app.register(rateLimit, {
    max: 240,
    timeWindow: '1 minute',
    allowList: () => env.NODE_ENV === 'test',
  });

  await app.register(authPlugin);

  // Centralised error handling → stable ApiError envelope.
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) {
      const body: ApiError = {
        error: { code: err.code, message: err.message, details: err.details },
      };
      return reply.code(err.statusCode).send(body);
    }
    if (err instanceof ZodError) {
      const body: ApiError = {
        error: {
          code: ERROR_CODES.VALIDATION,
          message: 'Validation failed',
          details: err.flatten(),
        },
      };
      return reply.code(400).send(body);
    }
    if ((err as { statusCode?: number }).statusCode === 429) {
      const body: ApiError = {
        error: { code: ERROR_CODES.RATE_LIMITED, message: 'Too many requests' },
      };
      return reply.code(429).send(body);
    }
    req.log.error(err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    const body: ApiError = {
      error: {
        code: ERROR_CODES.INTERNAL,
        message: env.NODE_ENV === 'production' ? 'Internal server error' : message,
      },
    };
    return reply.code(500).send(body);
  });

  app.setNotFoundHandler((_req, reply) => {
    const body: ApiError = {
      error: { code: ERROR_CODES.NOT_FOUND, message: 'Route not found' },
    };
    return reply.code(404).send(body);
  });

  app.get('/health', async () => ({ status: 'ok', version: '1.0.0', ts: Date.now() }));
  app.get('/', async () => ({
    name: 'FitWerx API',
    version: '1.0.0',
    docs: '/health, /v1/*',
  }));

  await app.register(authRoutes);
  await app.register(tenantRoutes);
  await app.register(catalogRoutes);
  await app.register(fitRoutes);
  await app.register(publicRoutes);

  return app;
}
