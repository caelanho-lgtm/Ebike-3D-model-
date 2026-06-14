import {
  recommendBikes,
  type BikeModel as EngineBikeModel,
  type ComponentConstraints,
  type Discipline,
} from '@fitwerx/fit-engine';
import {
  toEngineRider,
  type ComponentConstraintsDto,
  type ModelRecommendationDto,
  type RecommendRequest,
  type RecommendResponse,
} from '@fitwerx/shared';
import { prisma } from '../db.js';

type DbModel = Awaited<ReturnType<typeof loadModels>>[number];

async function loadModels(tenantId: string, modelIds?: string[]) {
  return prisma.bikeModel.findMany({
    where: {
      tenantId,
      active: true,
      ...(modelIds && modelIds.length > 0 ? { id: { in: modelIds } } : {}),
    },
    include: { sizes: true },
  });
}

function toEngineModel(m: DbModel): EngineBikeModel {
  return {
    id: m.id,
    brand: m.brand,
    name: m.name,
    discipline: m.discipline as Discipline,
    sizes: m.sizes.map((s) => ({
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
      riderHeightRange:
        s.riderHeightMin != null && s.riderHeightMax != null
          ? { min: s.riderHeightMin, max: s.riderHeightMax }
          : undefined,
    })),
  };
}

function buildConstraints(
  dto?: Partial<ComponentConstraintsDto>,
): ComponentConstraints | undefined {
  if (!dto) return undefined;
  return {
    stemLengthRange: {
      min: dto.stemLengthMin ?? 60,
      max: dto.stemLengthMax ?? 130,
      step: dto.stemLengthStep ?? 10,
    },
    stemAngleRange: { min: dto.stemAngleMin ?? -17, max: dto.stemAngleMax ?? 17 },
    spacerRange: { min: dto.spacerMin ?? 0, max: dto.spacerMax ?? 40 },
    setbackOptions: dto.setbackOptions ?? [0, 15, 25],
  };
}

/**
 * Run the full fit + ranking pipeline against a tenant's active catalog and map
 * the engine output to API DTOs. This is the core "AI-driven sizing" endpoint.
 */
export async function runRecommendation(
  tenantId: string,
  body: RecommendRequest,
): Promise<{
  response: Omit<RecommendResponse, 'sessionId'>;
  engineModelsById: Map<string, DbModel>;
}> {
  const dbModels = await loadModels(tenantId, body.modelIds);
  const engineModelsById = new Map(dbModels.map((m) => [m.id, m]));
  const catalog = dbModels.map(toEngineModel);

  const riderInput = toEngineRider(body.rider);
  const result = recommendBikes(riderInput, catalog, {
    constraints: buildConstraints(body.constraints),
    limit: body.limit,
  });

  const recommendations: ModelRecommendationDto[] = result.recommendations.map(
    (rec) => {
      const db = engineModelsById.get(rec.model.id);
      return {
        modelId: rec.model.id,
        brand: rec.model.brand,
        name: rec.model.name,
        discipline: rec.model.discipline,
        imageUrl: db?.imageUrl ?? undefined,
        bestSize: rec.bestSize,
        allSizes: rec.allSizes,
        confidence: rec.confidence,
      };
    },
  );

  return {
    response: {
      fit: result.fit,
      recommendations,
      estimatedFields: result.estimatedFields,
    },
    engineModelsById,
  };
}
