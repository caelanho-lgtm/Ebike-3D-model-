'use client';

import { useFitStore } from '@/lib/store/fitStore';
import type { FitParameters } from '@/lib/fitEngine/calculateFit';

interface SliderDef {
  key: keyof FitParameters;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SADDLE: SliderDef[] = [
  { key: 'saddleHeight', label: 'Height', min: 600, max: 900, step: 1, unit: 'mm' },
  { key: 'saddleSetback', label: 'Fore / Aft (setback)', min: 0, max: 120, step: 1, unit: 'mm' },
  { key: 'saddleTilt', label: 'Tilt', min: -10, max: 10, step: 0.5, unit: '°' },
];
const BAR: SliderDef[] = [
  { key: 'handlebarReach', label: 'Reach', min: 350, max: 650, step: 1, unit: 'mm' },
  { key: 'handlebarHeight', label: 'Height', min: 450, max: 820, step: 1, unit: 'mm' },
];
const STEM: SliderDef[] = [
  { key: 'stemAngle', label: 'Angle', min: -20, max: 20, step: 1, unit: '°' },
  { key: 'crankLength', label: 'Crank length', min: 160, max: 180, step: 2.5, unit: 'mm' },
];

function Slider({ def }: { def: SliderDef }) {
  const value = useFitStore((s) => s.params[def.key]);
  const setParam = useFitStore((s) => s.setParam);
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{def.label}</span>
        <span className="font-mono text-holo">
          {value}
          {def.unit}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => setParam(def.key, Number(e.target.value) as FitParameters[typeof def.key])}
      />
    </div>
  );
}

function Group({ title, defs }: { title: string; defs: SliderDef[] }) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
      {defs.map((d) => (
        <Slider key={d.key} def={d} />
      ))}
    </div>
  );
}

export function FitControls() {
  const resetFit = useFitStore((s) => s.resetFit);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Fine-tune the position the auto-fit chose. Most riders never need to.
        </p>
        <button
          onClick={resetFit}
          className="shrink-0 rounded-md border border-edge px-2 py-1 text-xs text-slate-300 hover:bg-panel2"
        >
          Reset
        </button>
      </div>

      <Group title="Saddle" defs={SADDLE} />
      <Group title="Handlebar" defs={BAR} />
      <Group title="Stem & cranks" defs={STEM} />
    </div>
  );
}
