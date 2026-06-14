import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { notFound } from '../http.js';

/**
 * Unauthenticated, read-only endpoints consumed by the embeddable widget to
 * bootstrap branding + the public catalog for a given tenant slug. No secrets
 * are exposed; the widget still needs a valid API key to run recommendations.
 */
export async function publicRoutes(app: FastifyInstance) {
  app.get('/v1/public/:slug/config', async (req) => {
    const { slug } = req.params as { slug: string };
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        bikeModels: {
          where: { active: true },
          include: { sizes: true },
          orderBy: [{ brand: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!tenant) throw notFound('Unknown workspace');

    return {
      tenant: {
        name: tenant.name,
        slug: tenant.slug,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      },
      disciplines: Array.from(
        new Set(tenant.bikeModels.map((m) => m.discipline)),
      ),
      models: tenant.bikeModels.map((m) => ({
        id: m.id,
        brand: m.brand,
        name: m.name,
        discipline: m.discipline,
        imageUrl: m.imageUrl,
        sizeCount: m.sizes.length,
      })),
    };
  });
}
