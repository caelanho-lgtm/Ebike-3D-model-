import { NextResponse } from 'next/server';
import { resolveTenantId } from '@/server/db';
import { listRiders, saveRider, type SaveRiderInput } from '@/server/api/rider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const tenantId = resolveTenantId(req.headers);
  try {
    const riders = await listRiders(tenantId);
    return NextResponse.json({ riders });
  } catch {
    return NextResponse.json({ error: 'Datastore unavailable' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const tenantId = resolveTenantId(req.headers);
  let body: SaveRiderInput;
  try {
    body = (await req.json()) as SaveRiderInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body?.heightMm) {
    return NextResponse.json({ error: 'heightMm is required' }, { status: 400 });
  }
  try {
    const rider = await saveRider(tenantId, body);
    return NextResponse.json({ rider }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Datastore unavailable' }, { status: 503 });
  }
}
