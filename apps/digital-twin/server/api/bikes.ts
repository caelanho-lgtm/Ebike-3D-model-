import { BIKE_CATALOG, type BikeModel } from '@/lib/geometry/bikeGeometry';
import { prisma } from '../db';

/**
 * List bikes for a tenant. Falls back to the built-in catalog when the database
 * is empty or unavailable, so the platform is fully functional without a DB.
 */
export async function listBikes(tenantId: string): Promise<BikeModel[]> {
  try {
    const rows = await prisma.bike.findMany({
      where: { tenantId, active: true },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    });
    if (rows.length === 0) return BIKE_CATALOG;
    return rows.map((r) => ({
      id: r.id,
      brand: r.brand,
      name: r.name,
      discipline: r.discipline as BikeModel['discipline'],
      wheelRadius: r.wheelRadius,
      sizes: JSON.parse(r.sizesJson) as BikeModel['sizes'],
    }));
  } catch {
    return BIKE_CATALOG;
  }
}
