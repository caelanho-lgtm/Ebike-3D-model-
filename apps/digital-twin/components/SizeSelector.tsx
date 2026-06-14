'use client';

import {
  BIKE_CATALOG,
  DISCIPLINE_LABELS,
  FRAME_SIZES,
  getGeometry,
} from '@/lib/geometry/bikeGeometry';
import { useFitStore, type RidingStyle } from '@/lib/store/fitStore';

const STYLES: { value: RidingStyle; label: string; hint: string }[] = [
  { value: 'comfort', label: 'Comfort', hint: 'Upright & relaxed' },
  { value: 'balanced', label: 'Balanced', hint: 'All-round' },
  { value: 'performance', label: 'Performance', hint: 'Low & fast' },
];

export function SizeSelector() {
  const bikeId = useFitStore((s) => s.bikeId);
  const size = useFitStore((s) => s.size);
  const rider = useFitStore((s) => s.rider);
  const style = useFitStore((s) => s.style);
  const selectBike = useFitStore((s) => s.selectBike);
  const setSize = useFitStore((s) => s.setSize);
  const setRider = useFitStore((s) => s.setRider);
  const setStyle = useFitStore((s) => s.setStyle);

  const heightCm = Math.round(rider.height / 10);

  return (
    <div className="panel p-4">
      <h3 className="mb-3 text-sm font-bold">Your measurements</h3>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-400">
          Height (cm)
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setRider({ height: Number(e.target.value) * 10 })}
            className="mt-1 w-full rounded-md border border-edge bg-panel2 px-2 py-1.5 text-sm text-slate-100"
          />
        </label>
        <label className="text-xs text-slate-400">
          Inseam (cm)
          <input
            type="number"
            value={rider.inseam ? Math.round(rider.inseam / 10) : ''}
            placeholder="optional"
            onChange={(e) => setRider({ inseam: e.target.value ? Number(e.target.value) * 10 : undefined })}
            className="mt-1 w-full rounded-md border border-edge bg-panel2 px-2 py-1.5 text-sm text-slate-100"
          />
        </label>
      </div>

      <h3 className="mb-2 text-sm font-bold">Riding style</h3>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStyle(s.value)}
            className={`rounded-lg border px-2 py-2 text-center ${
              style === s.value ? 'border-holo bg-holo/10' : 'border-edge hover:bg-panel2'
            }`}
          >
            <div className={`text-sm font-semibold ${style === s.value ? 'text-holo' : 'text-slate-200'}`}>
              {s.label}
            </div>
            <div className="text-[10px] text-slate-500">{s.hint}</div>
          </button>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-bold">Bike</h3>
      <select
        value={bikeId}
        onChange={(e) => selectBike(e.target.value, size)}
        className="mb-3 w-full rounded-md border border-edge bg-panel2 px-2 py-1.5 text-sm text-slate-100"
      >
        {BIKE_CATALOG.map((b) => (
          <option key={b.id} value={b.id}>
            {b.brand} {b.name} · {DISCIPLINE_LABELS[b.discipline]}
          </option>
        ))}
      </select>

      <div className="mb-1 text-xs text-slate-400">Size</div>
      <div className="grid grid-cols-4 gap-2">
        {FRAME_SIZES.map((sz) => {
          const geo = getGeometry(bikeId, sz);
          const inRange = geo ? heightCm >= geo.riderHeightCm[0] && heightCm <= geo.riderHeightCm[1] : false;
          return (
            <button
              key={sz}
              onClick={() => setSize(sz)}
              className={`relative rounded-md border px-2 py-2 text-sm font-semibold ${
                sz === size ? 'border-holo bg-holo/10 text-holo' : 'border-edge text-slate-300 hover:bg-panel2'
              }`}
              title={geo ? `Recommended for ${geo.riderHeightCm[0]}–${geo.riderHeightCm[1]} cm` : ''}
            >
              {sz}
              {inRange && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Green dot = recommended for your height.</p>
    </div>
  );
}
