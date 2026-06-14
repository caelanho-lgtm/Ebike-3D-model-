import { notFound } from "next/navigation";
import { FitIntake } from "@/components/fit-intake";
import { resolveTenantFromSlug } from "@/lib/domain/tenant-registry";

export default async function EmbedPage({
  params
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = resolveTenantFromSlug(tenantSlug);

  if (!tenant || !tenant.featureFlags.whiteLabelEmbeds) {
    notFound();
  }

  return (
    <main className="embed-page">
      <section className="embed-frame">
        <FitIntake tenant={tenant} compact />
      </section>
    </main>
  );
}
