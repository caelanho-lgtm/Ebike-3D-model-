import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantFromHost } from "@/lib/domain/tenant-registry";

export function proxy(request: NextRequest): NextResponse {
  const tenant = resolveTenantFromHost(request.headers.get("host"));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenant.id);
  requestHeaders.set("x-tenant-slug", tenant.slug);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set("X-Tenant-Id", tenant.id);
  response.headers.set("X-Tenant-Slug", tenant.slug);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
