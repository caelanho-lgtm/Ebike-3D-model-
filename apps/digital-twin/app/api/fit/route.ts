import { NextResponse } from 'next/server';
import { resolveTenantId } from '@/server/db';
import { computeFit, type ComputeFitInput } from '@/server/api/fit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const tenantId = resolveTenantId(req.headers);
  let body: ComputeFitInput;
  try {
    body = (await req.json()) as ComputeFitInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body?.rider?.height || !body?.params) {
    return NextResponse.json({ error: 'rider.height and params are required' }, { status: 400 });
  }
  const result = await computeFit(tenantId, body);
  return NextResponse.json(result);
}
