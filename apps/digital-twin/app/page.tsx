import Link from 'next/link';

const FEATURES = [
  { title: '3D Holographic Rider', body: 'A volumetric, anatomically-proportioned rider posed in real time from biomechanical inverse kinematics — male/female with an optional wireframe overlay.' },
  { title: 'Interactive Fit', body: 'Drag saddle height, setback, tilt, bar reach/height and stem angle. The 3D twin and joint angles update instantly.' },
  { title: 'Biomechanics Engine', body: 'Knee, hip and back angles, reach, saddle height/setback, a 0–100 fit score and plain-language warnings.' },
  { title: 'Size & Model Compare', body: 'Put two bikes side-by-side, switch sizes, and see geometry deltas and resulting fit scores.' },
  { title: 'AI Fit Coach', body: 'Structured, human-readable insights and concrete recommendations for the current position.' },
  { title: 'Multi-tenant SaaS', body: 'White-label ready — embed the twin into any brand or retailer storefront from day one.' },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4">
      <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full border border-edge bg-panel px-3 py-1 text-xs font-semibold text-holo">
            Bike Fit · Digital Twin · AI
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            See your perfect ride before you buy it.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            A production-grade, multi-tenant platform that turns body measurements into an interactive
            3D holographic fit — with real biomechanics and AI coaching that brands and shops embed into
            their storefronts.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/fit" className="rounded-lg bg-holo px-5 py-3 font-semibold text-ink hover:bg-cyan-300">
              Launch Fit Studio →
            </Link>
            <Link href="/compare" className="rounded-lg border border-edge px-5 py-3 font-semibold text-slate-200 hover:bg-panel2">
              Compare bikes
            </Link>
          </div>
        </div>

        <div className="panel relative overflow-hidden p-1 shadow-glow">
          <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-panel2 to-ink">
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="text-6xl">🚲</div>
              <div className="text-sm text-slate-400">Open the Fit Studio for the live 3D twin.</div>
              <Link href="/fit" className="text-sm font-semibold text-holo hover:underline">
                Enter the studio →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-20 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel p-5">
            <h3 className="text-base font-bold text-slate-100">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
