import type { NextRequest } from "next/server";
import { createSizingDecision } from "@/lib/domain/ai-sizing-service";
import { sizingRequestSchema } from "@/lib/domain/schemas";
import { auditEvent, corsPreflight, jsonResponse, resolveTenantForApi } from "@/lib/platform/http";

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request);
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = sizingRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Sizing request did not pass validation.",
          issues: parsed.error.issues
        }
      },
      { status: 400 }
    );
  }

  const tenant = resolveTenantForApi(parsed.data.tenantSlug);
  if (!tenant) {
    return jsonResponse(
      {
        error: {
          code: "TENANT_NOT_FOUND",
          message: "The requested tenant does not exist."
        }
      },
      { status: 404 }
    );
  }

  const origin = request.headers.get("origin");
  if (origin && !tenant.integration.allowedOrigins.includes(origin)) {
    auditEvent("sizing.origin_denied", {
      tenantId: tenant.id,
      origin,
      source: parsed.data.source
    });

    return jsonResponse(
      {
        error: {
          code: "ORIGIN_NOT_ALLOWED",
          message: "This origin is not registered for the tenant."
        }
      },
      { status: 403 }
    );
  }

  const decision = await createSizingDecision(tenant, parsed.data.profile);
  auditEvent("sizing.decision_created", {
    tenantId: tenant.id,
    requestId: decision.audit.requestId,
    source: parsed.data.source,
    recommendations: decision.recommendations.length
  });

  return jsonResponse({ data: decision }, { status: 201 }, tenant, request);
}
