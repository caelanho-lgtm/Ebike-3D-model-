import type { FastifyInstance } from 'fastify';
import {
  inviteUserSchema,
  tenantSettingsSchema,
  type AuthUser,
  type TenantDto,
} from '@fitwerx/shared';
import { prisma } from '../db.js';
import { hashPassword } from '../auth/password.js';
import { generateApiKey } from '../auth/apikey.js';
import { badRequest, conflict, notFound } from '../http.js';

function toTenantDto(t: {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  logoUrl: string | null;
  createdAt: Date;
}): TenantDto {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    primaryColor: t.primaryColor,
    logoUrl: t.logoUrl,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function tenantRoutes(app: FastifyInstance) {
  /** Get the current tenant's settings/branding. */
  app.get('/v1/tenant', { onRequest: [app.requireAuth] }, async (req) => {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.auth!.tenantId } });
    if (!tenant) throw notFound('Tenant not found');
    return toTenantDto(tenant);
  });

  /** Update branding/settings (admin+). */
  app.patch(
    '/v1/tenant',
    { onRequest: [app.requireRole('admin')] },
    async (req) => {
      const parsed = tenantSettingsSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest('Invalid settings', parsed.error.flatten());
      const tenant = await prisma.tenant.update({
        where: { id: req.auth!.tenantId },
        data: parsed.data,
      });
      return toTenantDto(tenant);
    },
  );

  /** List users in the tenant (admin+). */
  app.get(
    '/v1/tenant/users',
    { onRequest: [app.requireRole('admin')] },
    async (req) => {
      const users = await prisma.user.findMany({
        where: { tenantId: req.auth!.tenantId },
        orderBy: { createdAt: 'asc' },
      });
      return users.map<AuthUser>((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as AuthUser['role'],
        tenantId: u.tenantId,
        tenantSlug: req.auth!.tenantSlug,
      }));
    },
  );

  /** Create/invite a user (admin+). */
  app.post(
    '/v1/tenant/users',
    { onRequest: [app.requireRole('admin')] },
    async (req, reply) => {
      const parsed = inviteUserSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest('Invalid user payload', parsed.error.flatten());
      const { email, name, role, password } = parsed.data;
      const tenantId = req.auth!.tenantId;

      const existing = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
      });
      if (existing) throw conflict('A user with that email already exists.');

      const user = await prisma.user.create({
        data: {
          tenantId,
          email: email.toLowerCase(),
          name,
          role,
          passwordHash: await hashPassword(password),
        },
      });
      return reply.code(201).send({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: req.auth!.tenantSlug,
      });
    },
  );

  // --- API keys (for the embeddable widget) ---

  app.get(
    '/v1/tenant/api-keys',
    { onRequest: [app.requireRole('admin')] },
    async (req) => {
      const keys = await prisma.apiKey.findMany({
        where: { tenantId: req.auth!.tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt.toISOString(),
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        revokedAt: k.revokedAt?.toISOString() ?? null,
        // Display value is non-secret; full key is only returned at creation.
        maskedKey: `fwk_${k.prefix}_${'•'.repeat(8)}`,
      }));
    },
  );

  app.post(
    '/v1/tenant/api-keys',
    { onRequest: [app.requireRole('admin')] },
    async (req, reply) => {
      const body = (req.body ?? {}) as { name?: string };
      const name = (body.name ?? 'Widget key').slice(0, 80);
      const { fullKey, prefix, keyHash } = generateApiKey();
      const key = await prisma.apiKey.create({
        data: { tenantId: req.auth!.tenantId, name, prefix, keyHash },
      });
      // The full key is shown exactly once.
      return reply.code(201).send({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        key: fullKey,
        createdAt: key.createdAt.toISOString(),
      });
    },
  );

  app.delete(
    '/v1/tenant/api-keys/:id',
    { onRequest: [app.requireRole('admin')] },
    async (req) => {
      const { id } = req.params as { id: string };
      const key = await prisma.apiKey.findFirst({
        where: { id, tenantId: req.auth!.tenantId },
      });
      if (!key) throw notFound('API key not found');
      await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
      return { revoked: true };
    },
  );
}
