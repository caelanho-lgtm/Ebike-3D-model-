import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ROLE_RANK, type Role } from '@fitwerx/shared';
import { prisma } from '../db.js';
import { hashApiKey, parseApiKeyPrefix } from '../auth/apikey.js';
import { verifyToken } from '../auth/jwt.js';
import type { AuthContext } from '../auth/context.js';
import { forbidden, unauthorized } from '../http.js';

/**
 * Resolve the auth context from either a Bearer JWT (dashboard users) or an
 * `X-API-Key` header (embeddable widget / server-to-server). Returns null if no
 * credentials are present.
 */
async function resolveAuth(req: FastifyRequest): Promise<AuthContext | null> {
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.length > 0) {
    const prefix = parseApiKeyPrefix(apiKey);
    if (!prefix) throw unauthorized('Malformed API key');
    const record = await prisma.apiKey.findUnique({ where: { prefix } });
    if (!record || record.revokedAt) throw unauthorized('Invalid API key');
    if (record.keyHash !== hashApiKey(apiKey)) throw unauthorized('Invalid API key');
    // Best-effort last-used tracking; don't block the request on it.
    void prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    const tenant = await prisma.tenant.findUnique({ where: { id: record.tenantId } });
    if (!tenant) throw unauthorized('Invalid API key');
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      role: 'fitter',
      via: 'apikey',
    };
  }

  const authz = req.headers.authorization;
  if (typeof authz === 'string' && authz.startsWith('Bearer ')) {
    const token = authz.slice('Bearer '.length).trim();
    try {
      const payload = verifyToken(token);
      return {
        tenantId: payload.tenantId,
        tenantSlug: payload.tenantSlug,
        userId: payload.sub,
        role: payload.role,
        via: 'jwt',
      };
    } catch {
      throw unauthorized('Invalid or expired token');
    }
  }

  return null;
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  // Populate req.auth for every request (no-op if unauthenticated).
  app.addHook('onRequest', async (req) => {
    const ctx = await resolveAuth(req);
    if (ctx) req.auth = ctx;
  });

  /** Guard: require any authenticated principal. */
  app.decorate('requireAuth', async (req: FastifyRequest, _reply: FastifyReply) => {
    if (!req.auth) throw unauthorized();
  });

  /** Guard factory: require a JWT user with at least the given role. */
  app.decorate('requireRole', (minRole: Role) => {
    return async (req: FastifyRequest, _reply: FastifyReply) => {
      if (!req.auth) throw unauthorized();
      if (req.auth.via !== 'jwt') {
        throw forbidden('This action requires a dashboard user session.');
      }
      if (ROLE_RANK[req.auth.role] < ROLE_RANK[minRole]) {
        throw forbidden(`Requires ${minRole} role or higher.`);
      }
    };
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      minRole: Role,
    ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
