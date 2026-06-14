import { prisma } from '../db';

export interface SaveRiderInput {
  name?: string;
  sex?: string;
  heightMm: number;
  inseamMm?: number;
  armLengthMm?: number;
  torsoMm?: number;
  flexibility?: string;
}

/** Persist a rider profile for a tenant. */
export async function saveRider(tenantId: string, input: SaveRiderInput) {
  return prisma.rider.create({
    data: {
      tenantId,
      name: input.name,
      sex: input.sex ?? 'male',
      heightMm: Math.round(input.heightMm),
      inseamMm: input.inseamMm ? Math.round(input.inseamMm) : null,
      armLengthMm: input.armLengthMm ? Math.round(input.armLengthMm) : null,
      torsoMm: input.torsoMm ? Math.round(input.torsoMm) : null,
      flexibility: input.flexibility ?? 'medium',
    },
  });
}

export async function listRiders(tenantId: string) {
  return prisma.rider.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
