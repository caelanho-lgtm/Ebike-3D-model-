import type { FastifyInstance } from 'fastify';
import {
  bikeModelInputSchema,
  type BikeModelDto,
  type FrameGeometryDto,
} from '@fitwerx/shared';
import { prisma } from '../db.js';
import { badRequest, notFound } from '../http.js';

type DbModelWithSizes = {
  id: string;
  tenantId: string;
  brand: string;
  name: string;
  discipline: string;
  description: string | null;
  msrpCents: number | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  sizes: Array<{
    sizeLabel: string;
    stack: number;
    reach: number;
    seatTubeAngle: number;
    headTubeAngle: number;
    headTubeLength: number | null;
    topTube: number | null;
    standover: number | null;
    wheelbase: number | null;
    stockCrankLength: number | null;
    riderHeightMin: number | null;
    riderHeightMax: number | null;
  }>;
};

function toDto(m: DbModelWithSizes): BikeModelDto {
  return {
    id: m.id,
    tenantId: m.tenantId,
    brand: m.brand,
    name: m.name,
    discipline: m.discipline as BikeModelDto['discipline'],
    description: m.description ?? undefined,
    msrpCents: m.msrpCents ?? undefined,
    imageUrl: m.imageUrl ?? undefined,
    active: m.active,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    sizes: m.sizes.map<FrameGeometryDto>((s) => ({
      sizeLabel: s.sizeLabel,
      stack: s.stack,
      reach: s.reach,
      seatTubeAngle: s.seatTubeAngle,
      headTubeAngle: s.headTubeAngle,
      headTubeLength: s.headTubeLength ?? undefined,
      topTube: s.topTube ?? undefined,
      standover: s.standover ?? undefined,
      wheelbase: s.wheelbase ?? undefined,
      stockCrankLength: s.stockCrankLength ?? undefined,
      riderHeightMin: s.riderHeightMin ?? undefined,
      riderHeightMax: s.riderHeightMax ?? undefined,
    })),
  };
}

export async function catalogRoutes(app: FastifyInstance) {
  /** List models for the tenant. Available to any authenticated principal. */
  app.get('/v1/catalog/models', { onRequest: [app.requireAuth] }, async (req) => {
    const query = req.query as { discipline?: string; active?: string };
    const models = await prisma.bikeModel.findMany({
      where: {
        tenantId: req.auth!.tenantId,
        ...(query.discipline ? { discipline: query.discipline } : {}),
        ...(query.active === 'true'
          ? { active: true }
          : query.active === 'false'
            ? { active: false }
            : {}),
      },
      include: { sizes: true },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    });
    return models.map(toDto);
  });

  app.get('/v1/catalog/models/:id', { onRequest: [app.requireAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const model = await prisma.bikeModel.findFirst({
      where: { id, tenantId: req.auth!.tenantId },
      include: { sizes: true },
    });
    if (!model) throw notFound('Bike model not found');
    return toDto(model);
  });

  /** Create a model with its sizes (fitter+). */
  app.post(
    '/v1/catalog/models',
    { onRequest: [app.requireRole('fitter')] },
    async (req, reply) => {
      const parsed = bikeModelInputSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest('Invalid model payload', parsed.error.flatten());
      const data = parsed.data;
      const model = await prisma.bikeModel.create({
        data: {
          tenantId: req.auth!.tenantId,
          brand: data.brand,
          name: data.name,
          discipline: data.discipline,
          description: data.description,
          msrpCents: data.msrpCents,
          imageUrl: data.imageUrl,
          active: data.active,
          sizes: {
            create: data.sizes.map((s) => ({
              sizeLabel: s.sizeLabel,
              stack: s.stack,
              reach: s.reach,
              seatTubeAngle: s.seatTubeAngle,
              headTubeAngle: s.headTubeAngle,
              headTubeLength: s.headTubeLength,
              topTube: s.topTube,
              standover: s.standover,
              wheelbase: s.wheelbase,
              stockCrankLength: s.stockCrankLength,
              riderHeightMin: s.riderHeightMin,
              riderHeightMax: s.riderHeightMax,
            })),
          },
        },
        include: { sizes: true },
      });
      return reply.code(201).send(toDto(model));
    },
  );

  /** Replace a model + its sizes (fitter+). */
  app.put(
    '/v1/catalog/models/:id',
    { onRequest: [app.requireRole('fitter')] },
    async (req) => {
      const { id } = req.params as { id: string };
      const parsed = bikeModelInputSchema.safeParse(req.body);
      if (!parsed.success) throw badRequest('Invalid model payload', parsed.error.flatten());
      const existing = await prisma.bikeModel.findFirst({
        where: { id, tenantId: req.auth!.tenantId },
      });
      if (!existing) throw notFound('Bike model not found');
      const data = parsed.data;

      const model = await prisma.$transaction(async (tx) => {
        await tx.frameSize.deleteMany({ where: { bikeModelId: id } });
        return tx.bikeModel.update({
          where: { id },
          data: {
            brand: data.brand,
            name: data.name,
            discipline: data.discipline,
            description: data.description,
            msrpCents: data.msrpCents,
            imageUrl: data.imageUrl,
            active: data.active,
            sizes: {
              create: data.sizes.map((s) => ({
                sizeLabel: s.sizeLabel,
                stack: s.stack,
                reach: s.reach,
                seatTubeAngle: s.seatTubeAngle,
                headTubeAngle: s.headTubeAngle,
                headTubeLength: s.headTubeLength,
                topTube: s.topTube,
                standover: s.standover,
                wheelbase: s.wheelbase,
                stockCrankLength: s.stockCrankLength,
                riderHeightMin: s.riderHeightMin,
                riderHeightMax: s.riderHeightMax,
              })),
            },
          },
          include: { sizes: true },
        });
      });
      return toDto(model);
    },
  );

  /** Delete a model (admin+). */
  app.delete(
    '/v1/catalog/models/:id',
    { onRequest: [app.requireRole('admin')] },
    async (req) => {
      const { id } = req.params as { id: string };
      const existing = await prisma.bikeModel.findFirst({
        where: { id, tenantId: req.auth!.tenantId },
      });
      if (!existing) throw notFound('Bike model not found');
      await prisma.bikeModel.delete({ where: { id } });
      return { deleted: true };
    },
  );
}
