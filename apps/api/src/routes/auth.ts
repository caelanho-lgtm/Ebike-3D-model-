import type { FastifyInstance } from 'fastify';
import {
  loginSchema,
  signupSchema,
  type AuthResponse,
  type AuthUser,
} from '@fitwerx/shared';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signToken } from '../auth/jwt.js';
import { badRequest, conflict, unauthorized } from '../http.js';

export async function authRoutes(app: FastifyInstance) {
  /** Sign up: provisions a new tenant + its owner user atomically. */
  app.post('/v1/auth/signup', async (req, reply) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid signup payload', parsed.error.flatten());
    const { tenantName, tenantSlug, email, password, name } = parsed.data;

    const existing = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (existing) throw conflict('That workspace slug is already taken.');

    const passwordHash = await hashPassword(password);
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName, slug: tenantSlug },
      });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: email.toLowerCase(),
          name,
          role: 'owner',
          passwordHash,
        },
      });
      return { tenant, user };
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'owner',
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    };
    const { token, expiresIn } = signToken({
      sub: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      role: 'owner',
      email: user.email,
      name: user.name,
    });
    const res: AuthResponse = { token, expiresIn, user: authUser };
    return reply.code(201).send(res);
  });

  /** Log in within a tenant. Email is unique per tenant, so we look up across
   * tenants and match by password; emails are also globally unique in practice
   * for this demo seed. */
  app.post('/v1/auth/login', async (req) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid login payload', parsed.error.flatten());
    const { email, password } = parsed.data;

    const users = await prisma.user.findMany({
      where: { email: email.toLowerCase() },
      include: { tenant: true },
    });
    for (const user of users) {
      if (await verifyPassword(password, user.passwordHash)) {
        const { token, expiresIn } = signToken({
          sub: user.id,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          role: user.role as AuthUser['role'],
          email: user.email,
          name: user.name,
        });
        const res: AuthResponse = {
          token,
          expiresIn,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as AuthUser['role'],
            tenantId: user.tenantId,
            tenantSlug: user.tenant.slug,
          },
        };
        return res;
      }
    }
    throw unauthorized('Incorrect email or password.');
  });

  /** Current user. */
  app.get('/v1/auth/me', { onRequest: [app.requireAuth] }, async (req) => {
    const auth = req.auth!;
    if (!auth.userId) {
      return { tenantId: auth.tenantId, tenantSlug: auth.tenantSlug, via: auth.via };
    }
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { tenant: true },
    });
    if (!user) throw unauthorized();
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AuthUser['role'],
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
    };
    return authUser;
  });
}
