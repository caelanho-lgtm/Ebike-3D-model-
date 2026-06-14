import { NextResponse } from 'next/server';
import { resolveTenantId } from '@/server/db';
import { listBikes } from '@/server/api/bikes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const tenantId = resolveTenantId(req.headers);
  const bikes = await listBikes(tenantId);
  return NextResponse.json({ bikes });
}
