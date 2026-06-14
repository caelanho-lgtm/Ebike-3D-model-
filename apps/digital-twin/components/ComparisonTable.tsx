'use client';

import { useMemo } from 'react';
import {
  BIKE_CATALOG,
  FRAME_SIZES,
  getBike,
  getGeometry,
  type FrameSize,
} from '@/lib/geometry/bikeGeometry';
import { calculateFit, deriveDefaultFit } from '@/lib/fitEngine/calculateFit';
import { useFitStore } from '@/lib/store/fitStore';

interface Column {
  bikeId: string;
  size: FrameSize;
}

function evaluate(rider: ReturnType<typeof useFitStore.getState>['rider'], col: Column) {
  const bike = getBike(col.bikeId)!;
  const geo = getGeometry(col.bikeId, col.size)!;
  const params = deriveDefaultFit(rider, geo);
  const fit = calculateFit(rider, params);
  return { bike, geo, fit };
}

function BikePicker({
  value,
  onBike,
  onSize,
}: {
  value: Column;
  onBike: (id: string) => void;
  onSize: (s: FrameSize) => void;
}) {
  return (
    <div className="flex gap-2">
      <select
        value={value.bikeId}
        onChange={(e) => onBike(e.target.value)}
        className="flex-1 rounded-md border border-edge bg-panel2 px-2 py-1.5 text-sm"
      >
        {BIKE_CATALOG.map((b) => (
          <option key={b.id} value={b.id}>
            {b.brand} {b.name}
          </option>
        ))}
      </select>
      <select
        value={value.size}
        onChange={(e) => onSize(e.target.value as FrameSize)}
        className="rounded-md border border-edge bg-panel2 px-2 py-1.5 text-sm"
      >
        {FRAME_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ComparisonTable() {
  const rider = useFitStore((s) => s.rider);
  const a: Column = { bikeId: useFitStore((s) => s.bikeId), size: useFitStore((s) => s.size) };
  const b: Column = { bikeId: useFitStore((s) => s.compareBikeId), size: useFitStore((s) => s.compareSize) };
  const selectBike = useFitStore((s) => s.selectBike);
  const setCompare = useFitStore((s) => s.setCompare);

  const A = useMemo(() => evaluate(rider, a), [rider, a.bikeId, a.size]);
  const B = useMemo(() => evaluate(rider, b), [rider, b.bikeId, b.size]);

  const rows: { label: string; a: number | string; b: number | string; unit?: string }[] = [
    { label: 'Stack', a: A.geo.stack, b: B.geo.stack, unit: 'mm' },
    { label: 'Reach', a: A.geo.reach, b: B.geo.reach, unit: 'mm' },
    { label: 'Seat-tube angle', a: A.geo.seatTubeAngle, b: B.geo.seatTubeAngle, unit: '°' },
    { label: 'Head-tube angle', a: A.geo.headTubeAngle, b: B.geo.headTubeAngle, unit: '°' },
    { label: 'Chainstay', a: A.geo.chainstay, b: B.geo.chainstay, unit: 'mm' },
    { label: 'Wheelbase', a: A.geo.wheelbase, b: B.geo.wheelbase, unit: 'mm' },
    { label: 'Crank length', a: A.geo.crankLength, b: B.geo.crankLength, unit: 'mm' },
    { label: 'Stem length', a: A.geo.stemLength, b: B.geo.stemLength, unit: 'mm' },
  ];

  const fitRows: { label: string; a: number; b: number; unit: string }[] = [
    { label: 'Saddle height', a: A.fit.saddleHeight, b: B.fit.saddleHeight, unit: 'mm' },
    { label: 'Saddle → bar reach', a: A.fit.reach, b: B.fit.reach, unit: 'mm' },
    { label: 'Knee angle', a: A.fit.kneeAngle, b: B.fit.kneeAngle, unit: '°' },
    { label: 'Hip angle', a: A.fit.hipAngle, b: B.fit.hipAngle, unit: '°' },
    { label: 'Back angle', a: A.fit.backAngle, b: B.fit.backAngle, unit: '°' },
  ];

  const Diff = ({ a, b }: { a: number; b: number }) => {
    const d = Math.round((b - a) * 10) / 10;
    if (d === 0) return <span className="text-slate-500">—</span>;
    return <span className={d > 0 ? 'text-emerald-400' : 'text-rose-400'}>{d > 0 ? `+${d}` : d}</span>;
  };

  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-3 gap-3 border-b border-edge p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bike A</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bike B</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Δ (B − A)</div>
        <BikePicker value={a} onBike={(id) => selectBike(id, a.size)} onSize={(s) => selectBike(a.bikeId, s)} />
        <BikePicker value={b} onBike={(id) => setCompare(id, b.size)} onSize={(s) => setCompare(b.bikeId, s)} />
        <div />
      </div>

      <table className="w-full text-sm">
        <tbody>
          <tr className="bg-panel2/50">
            <td className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400" colSpan={4}>
              Fit score
            </td>
          </tr>
          <tr className="border-b border-edge">
            <td className="px-4 py-3 font-bold text-holo">{A.fit.fitScore}/100</td>
            <td className="px-4 py-3 font-bold text-holo">{B.fit.fitScore}/100</td>
            <td className="px-4 py-3 font-semibold">
              <Diff a={A.fit.fitScore} b={B.fit.fitScore} />
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">higher is better</td>
          </tr>

          <tr className="bg-panel2/50">
            <td className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400" colSpan={4}>
              Geometry
            </td>
          </tr>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-edge/60">
              <td className="px-4 py-2 text-slate-200">
                {r.a}
                <span className="text-slate-500">{r.unit}</span>
              </td>
              <td className="px-4 py-2 text-slate-200">
                {r.b}
                <span className="text-slate-500">{r.unit}</span>
              </td>
              <td className="px-4 py-2">
                {typeof r.a === 'number' && typeof r.b === 'number' ? <Diff a={r.a} b={r.b} /> : '—'}
              </td>
              <td className="px-4 py-2 text-xs text-slate-500">{r.label}</td>
            </tr>
          ))}

          <tr className="bg-panel2/50">
            <td className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400" colSpan={4}>
              Resulting fit
            </td>
          </tr>
          {fitRows.map((r) => (
            <tr key={r.label} className="border-b border-edge/60">
              <td className="px-4 py-2 text-slate-200">
                {r.a}
                {r.unit}
              </td>
              <td className="px-4 py-2 text-slate-200">
                {r.b}
                {r.unit}
              </td>
              <td className="px-4 py-2">
                <Diff a={r.a} b={r.b} />
              </td>
              <td className="px-4 py-2 text-xs text-slate-500">{r.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
