import { tenants } from "@/lib/domain/tenant-registry";
import { jsonResponse } from "@/lib/platform/http";

export async function GET() {
  return jsonResponse({
    data: tenants.map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      displayName: tenant.displayName,
      plan: tenant.plan,
      locale: tenant.locale,
      theme: tenant.theme,
      featureFlags: tenant.featureFlags,
      integration: {
        allowedOrigins: tenant.integration.allowedOrigins,
        apiKeyHint: tenant.integration.apiKeyHint,
        ssoEnabled: tenant.integration.ssoEnabled
      }
    }))
  });
}
