import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveTenantFromSlug, tenants } from "@/lib/domain/tenant-registry";
import type { Tenant } from "@/lib/domain/types";

export function jsonResponse<T>(
  body: T,
  init: ResponseInit = {},
  tenant?: Tenant,
  request?: NextRequest
): NextResponse<T> {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");

  if (tenant && request) {
    const origin = request.headers.get("origin");
    if (origin && tenant.integration.allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Vary", "Origin");
    }
  }

  return response;
}

export function resolveTenantForApi(tenantSlug: string): Tenant | undefined {
  return resolveTenantFromSlug(tenantSlug);
}

export function corsPreflight(request: NextRequest, tenantSlug?: string): NextResponse {
  const tenant = tenantSlug ? resolveTenantForApi(tenantSlug) : undefined;
  const origin = request.headers.get("origin");
  const allowed =
    !origin ||
    tenants.some((candidate) => candidate.integration.allowedOrigins.includes(origin)) ||
    tenant?.integration.allowedOrigins.includes(origin);

  if (!allowed) {
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 204 });
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Tenant-Slug");
  response.headers.set("Access-Control-Max-Age", "600");
  return response;
}

export function auditEvent(event: string, metadata: Record<string, string | number | boolean>): void {
  console.info(
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...metadata
    })
  );
}
