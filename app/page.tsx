import { headers } from "next/headers";
import { FitIntake } from "@/components/fit-intake";
import { resolveTenantFromHost, tenants } from "@/lib/domain/tenant-registry";

export default async function Home() {
  const headerStore = await headers();
  const tenant = resolveTenantFromHost(headerStore.get("host"));

  return (
    <main className="app-shell">
      <nav className="nav" aria-label="Primary">
        <a className="brand-mark" href="/">
          <span className="brand-icon">V</span>
          <span>VeloFit Enterprise</span>
        </a>
        <div className="nav-links">
          <a href="#platform">Platform</a>
          <a href="#sizing">Sizing</a>
          <a href={`/embed/${tenant.slug}`}>Embed</a>
        </div>
      </nav>

      <section className="hero">
        <div>
          <span className="pill">Tenant: {tenant.displayName}</span>
          <h1>Embedded bike fitting infrastructure for serious commerce.</h1>
          <p>
            A multi-tenant SaaS foundation for bicycle brands and retailers: validated
            anthropometrics, deterministic fit scoring, AI-ready explanations, white-label embeds,
            dealer handoff, and real-time 3D bike visualization.
          </p>
          <div className="cta-row">
            <a className="button" href="#sizing">
              Run a fit session
            </a>
            <a className="button secondary" href="/api/v1/tenants">
              View tenant API
            </a>
          </div>
          <div className="tenant-strip">
            {tenants.map((item) => (
              <span className="pill" key={item.id}>
                {item.displayName} / {item.plan}
              </span>
            ))}
          </div>
        </div>
        <div className="card pad">
          <h2>Production pillars</h2>
          <div className="grid">
            <div className="metric">
              <strong>Tenant isolated</strong>
              <span>Domain resolution, themed embeds, per-tenant catalogs, origin allowlists.</span>
            </div>
            <div className="metric">
              <strong>Fit explainability</strong>
              <span>Reach, stack, standover, intent scoring, and cockpit setup recommendations.</span>
            </div>
            <div className="metric">
              <strong>AI boundary</strong>
              <span>Provider interface with deterministic fallback, audit IDs, and model disclosure.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="section-header">
          <div>
            <span className="pill">Enterprise platform</span>
            <h2>Built for embedded brand and shop journeys.</h2>
          </div>
        </div>
        <div className="grid three">
          <article className="card pad">
            <h3>White-label embeds</h3>
            <p>
              Partner storefronts can embed tenant-themed fit sessions while API responses enforce
              registered origins and no-store privacy defaults.
            </p>
          </article>
          <article className="card pad">
            <h3>Geometry intelligence</h3>
            <p>
              Recommendations use frame geometry, rider measurements, rider intent, flexibility,
              and category preferences instead of generic height-only size charts.
            </p>
          </article>
          <article className="card pad">
            <h3>Commerce handoff</h3>
            <p>
              Every decision includes frame, cockpit, confidence, model metadata, and next-best
              actions ready for carts, CRMs, dealer workflows, or analytics streams.
            </p>
          </article>
        </div>
      </section>

      <section className="section" id="sizing">
        <div className="section-header">
          <div>
            <span className="pill">Live sizing workflow</span>
            <h2>Generate a fit recommendation.</h2>
          </div>
        </div>
        <FitIntake tenant={tenant} />
      </section>
    </main>
  );
}
