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
  const bikeId = useFitStore((s) => s.bikeId);
  const size = useFitStore((s) => s.size);
  const fit = useFitStore((s) => s.fit);
  const ui = useFitStore((s) => s.ui);
  const sex = useFitStore((s) => s.rider.sex);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Fit Studio</h1>
      <p className="mb-5 text-sm text-slate-400">
        Adjust the fit and watch the holographic twin and joint angles respond in real time.
      </p>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_340px]">
        <div className="space-y-4">
          <SizeSelector />
          <FitControls />
        </div>

        <div className="panel min-h-[420px] overflow-hidden lg:min-h-[640px]">
          <BikeViewer3D
            bikeId={bikeId}
            size={size}
            fit={fit}
            showRider={ui.showRider}
            wireframe={ui.wireframe}
            riderSex={sex}
            autoRotate={ui.autoRotate}
            className="h-[420px] lg:h-[640px]"
          />
        </div>

        <div className="space-y-4">
          <AIInsightPanel />
          {fit.warnings.length > 0 && (
            <div className="panel p-4">
              <h3 className="mb-2 text-sm font-bold">Warnings</h3>
              <ul className="space-y-2">
                {fit.warnings.map((w, i) => (
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
