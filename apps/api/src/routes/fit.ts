import type { FastifyInstance } from 'fastify';
import { recommendRequestSchema, type RecommendResponse } from '@fitwerx/shared';
import { prisma } from '../db.js';
import { runRecommendation } from '../services/recommendation.js';
import { badRequest, notFound } from '../http.js';

export async function fitRoutes(app: FastifyInstance) {
  /**
   * Core endpoint: compute fit + ranked bike recommendations.
   * Works with either a JWT (dashboard) or an API key (widget). When
   * `persist: true`, the run is stored as a FitSession for the tenant.
   */
  app.post('/v1/fit/recommend', { onRequest: [app.requireAuth] }, async (req) => {
    const parsed = recommendRequestSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid request', parsed.error.flatten());
    const body = parsed.data;
    const auth = req.auth!;

    const { response } = await runRecommendation(auth.tenantId, body);

    let sessionId: string | undefined;
    if (body.persist) {
      const session = await prisma.fitSession.create({
        data: {
          tenantId: auth.tenantId,
          source: auth.via === 'apikey' ? 'widget' : 'dashboard',
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          riderInputJson: JSON.stringify(body.rider),
          fitJson: JSON.stringify(response.fit),
          recommendationsJson: JSON.stringify(response.recommendations),
          estimatedFields: JSON.stringify(response.estimatedFields),
          createdByUserId: auth.userId,
        },
      });
      sessionId = session.id;
    }

    const result: RecommendResponse = { ...response, sessionId };
    return result;
  });

  /** List persisted fit sessions for the tenant (dashboard users). */
  app.get('/v1/fit/sessions', { onRequest: [app.requireRole('viewer')] }, async (req) => {
    const query = req.query as { limit?: string; cursor?: string };
    const take = Math.min(Number(query.limit ?? 50) || 50, 100);
    const sessions = await prisma.fitSession.findMany({
      where: { tenantId: req.auth!.tenantId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
      include: { createdBy: { select: { name: true } } },
    });
    return sessions.map((s) => ({
      id: s.id,
      source: s.source,
      customerName: s.customerName,
      customerEmail: s.customerEmail,
      createdBy: s.createdBy?.name ?? null,
      createdAt: s.createdAt.toISOString(),
    }));
  });

  /** Fetch a full persisted session. */
  app.get('/v1/fit/sessions/:id', { onRequest: [app.requireRole('viewer')] }, async (req) => {
    const { id } = req.params as { id: string };
    const s = await prisma.fitSession.findFirst({
      where: { id, tenantId: req.auth!.tenantId },
    });
    if (!s) throw notFound('Session not found');
    return {
      id: s.id,
      source: s.source,
      customerName: s.customerName,
      customerEmail: s.customerEmail,
      rider: JSON.parse(s.riderInputJson),
      fit: JSON.parse(s.fitJson),
      recommendations: JSON.parse(s.recommendationsJson),
      estimatedFields: JSON.parse(s.estimatedFields),
      createdAt: s.createdAt.toISOString(),
    };
  });
}
