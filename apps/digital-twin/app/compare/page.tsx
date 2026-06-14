'use client';

import { ComparisonTable } from '@/components/ComparisonTable';

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Compare bikes</h1>
      <p className="mb-5 text-sm text-slate-400">
        Put two models or sizes side-by-side. Geometry deltas and the resulting fit (computed for your
        body) update instantly.
      </p>
      <ComparisonTable />
    </main>
  );
}
