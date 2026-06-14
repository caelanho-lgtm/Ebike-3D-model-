'use client';

import { useMemo } from 'react';
import { useFitStore } from '@/lib/store/fitStore';
import { getBike } from '@/lib/geometry/bikeGeometry';
import { generateFitCoaching } from '@/lib/ai/fitCoach';

const toneClass: Record<string, string> = {
  positive: 'border-emerald-500/40 bg-emerald-500/5',
  neutral: 'border-sky-500/40 bg-sky-500/5',
  caution: 'border-amber-500/40 bg-amber-500/5',
};

function scoreColor(score: number) {
  if (score >= 88) return '#22c55e';
  if (score >= 74) return '#38bdf8';
  if (score >= 58) return '#f59e0b';
  return '#ef4444';
}

export function AIInsightPanel() {
  const fit = useFitStore((s) => s.fit);
  const bikeId = useFitStore((s) => s.bikeId);
  const size = useFitStore((s) => s.size);

  const coaching = useMemo(
    () => generateFitCoaching({ fit, bike: getBike(bikeId), size }),
    [fit, bikeId, size],
  );

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">AI Fit Coach</h3>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-base font-extrabold"
          style={{ border: `3px solid ${scoreColor(fit.fitScore)}`, color: scoreColor(fit.fitScore) }}
        >
          {fit.fitScore}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Knee', value: `${fit.kneeAngle}°` },
          { label: 'Hip', value: `${fit.hipAngle}°` },
          { label: 'Back', value: `${fit.backAngle}°` },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-edge bg-panel2 py-2">
            <div className="text-lg font-bold text-holo">{m.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{m.label}</div>
          </div>
        ))}
      </div>

      <p className="mb-3 text-sm leading-relaxed text-slate-200">{coaching.summary}</p>

      <div className="space-y-2">
        {coaching.insights.map((ins, i) => (
          <div key={i} className={`rounded-lg border p-2.5 ${toneClass[ins.tone]}`}>
            <div className="text-xs font-semibold text-slate-100">{ins.title}</div>
            <div className="mt-0.5 text-[12px] leading-snug text-slate-300">{ins.detail}</div>
          </div>
        ))}
      </div>

      <h4 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Recommendations
      </h4>
      <ul className="space-y-2">
        {coaching.recommendations.map((rec, i) => (
          <li key={i} className="flex gap-2 text-[12px]">
            <span className="text-holo">→</span>
            <span>
              <b className="text-slate-100">{rec.action}.</b>{' '}
              <span className="text-slate-400">{rec.rationale}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
