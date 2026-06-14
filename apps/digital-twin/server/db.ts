import { PrismaClient } from '@/prisma/generated/client';

/** Prisma singleton (avoids exhausting connections during dev hot-reload). */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Resolve the tenant for a request. In production this would validate an API
 * key / JWT; here we read `x-tenant-id` and fall back to a default so the demo
 * works without auth wired up.
 */
export function resolveTenantId(headers: Headers): string {
  return headers.get('x-tenant-id') ?? 'demo-tenant';
}
