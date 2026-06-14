import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveTenantFromSlug } from "@/lib/domain/tenant-registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const tenant = resolveTenantFromSlug(tenantSlug);

  if (!tenant || !tenant.featureFlags.whiteLabelEmbeds) {
    return new NextResponse("Tenant embed is not available.", { status: 404 });
  }

  const origin = request.nextUrl.origin;
  const src = `${origin}/embed/${tenant.slug}`;
  const script = `
(function () {
  var currentScript = document.currentScript;
  var targetId = currentScript && currentScript.getAttribute("data-target");
  var mount = targetId ? document.getElementById(targetId) : null;
  if (!mount) {
    mount = document.createElement("div");
    mount.setAttribute("data-velofit-tenant", "${tenant.slug}");
    if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.insertBefore(mount, currentScript.nextSibling);
    } else {
      document.body.appendChild(mount);
    }
  }
  var iframe = document.createElement("iframe");
  iframe.src = "${src}";
  iframe.title = "${tenant.displayName} bike sizing";
  iframe.loading = "lazy";
  iframe.style.width = "100%";
  iframe.style.minHeight = "860px";
  iframe.style.border = "0";
  iframe.style.borderRadius = "24px";
  iframe.setAttribute("allow", "payment 'self'");
  mount.replaceChildren(iframe);
})();`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
}
