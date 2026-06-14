'use client';

import dynamic from 'next/dynamic';
import { SizeSelector } from '@/components/SizeSelector';
import { FitControls } from '@/components/FitControls';
import { AIInsightPanel } from '@/components/AIInsightPanel';
import { useFitStore } from '@/lib/store/fitStore';

const BikeViewer3D = dynamic(
  () => import('@/components/BikeViewer3D').then((m) => m.BikeViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-slate-500">Loading 3D twin…</div>
    ),
  },
);

export default function FitPage() {
  const warnings = useFitStore((s) => s.fit.warnings);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Fit Studio</h1>
      <p className="mb-5 text-sm text-slate-400">
        Enter your height and pick a riding style — we size the bike and pose your 3D twin automatically.
      </p>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_340px]">
        <div className="space-y-4">
          <SizeSelector />
          <details className="panel p-4 [&_summary]:cursor-pointer">
            <summary className="text-sm font-bold text-slate-200">Advanced fine-tuning</summary>
            <div className="mt-3">
              <FitControls />
            </div>
          </details>
        </div>

        <div className="panel min-h-[440px] overflow-hidden lg:min-h-[640px]">
          <BikeViewer3D className="h-[440px] lg:h-[640px]" />
        </div>

        <div className="space-y-4">
          <AIInsightPanel />
          {warnings.length > 0 && (
            <div className="panel p-4">
              <h3 className="mb-2 text-sm font-bold">Heads up</h3>
              <ul className="space-y-2">
                {warnings.map((w, i) => (
                  <li
                    key={i}
                    className={`rounded-md border px-3 py-2 text-xs ${
                      w.severity === 'critical'
                        ? 'border-rose-500/40 bg-rose-500/5 text-rose-200'
                        : w.severity === 'warning'
                          ? 'border-amber-500/40 bg-amber-500/5 text-amber-200'
                          : 'border-sky-500/40 bg-sky-500/5 text-sky-200'
                    }`}
                  >
                    {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
