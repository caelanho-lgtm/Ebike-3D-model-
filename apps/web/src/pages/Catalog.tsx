import { useEffect, useState } from 'react';
import type { BikeModelDto, Discipline, FrameGeometryDto } from '@fitwerx/shared';
import { api, ApiClientError } from '../api/client';

const DISCIPLINES: Discipline[] = [
  'road_race', 'road_endurance', 'gravel', 'mtb_xc', 'mtb_trail', 'tt_triathlon', 'commute_city',
];

const emptySize = (): FrameGeometryDto => ({
  sizeLabel: '', stack: 560, reach: 385, seatTubeAngle: 73.5, headTubeAngle: 72.5,
});

export function CatalogPage() {
  const [models, setModels] = useState<BikeModelDto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('road_endurance');
  const [sizes, setSizes] = useState<FrameGeometryDto[]>([emptySize()]);

  const load = () => api.listModels().then(setModels).catch(() => undefined);
  useEffect(() => { void load(); }, []);

  const updateSize = (idx: number, patch: Partial<FrameGeometryDto>) =>
    setSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.createModel({
        brand, name, discipline, active: true,
        sizes: sizes.filter((s) => s.sizeLabel.trim() !== ''),
      });
      setShowForm(false);
      setBrand(''); setName(''); setSizes([emptySize()]);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save model');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this model?')) return;
    await api.deleteModel(id).catch(() => undefined);
    await load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Catalog</h1>
          <p className="page-sub">Bike models and frame geometry used by the recommender.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Close' : '+ Add model'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h3 style={{ marginTop: 0 }}>New bike model</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="field-row">
            <div className="field"><label>Brand</label><input value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
            <div className="field"><label>Model name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>Discipline</label>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value as Discipline)}>
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <label>Sizes (stack / reach / seat-tube° / head-tube°, all mm/deg)</label>
          <table>
            <thead>
              <tr><th>Label</th><th>Stack</th><th>Reach</th><th>STA</th><th>HTA</th><th /></tr>
            </thead>
            <tbody>
              {sizes.map((s, i) => (
                <tr key={i}>
                  <td><input value={s.sizeLabel} onChange={(e) => updateSize(i, { sizeLabel: e.target.value })} placeholder="54" /></td>
                  <td><input type="number" value={s.stack} onChange={(e) => updateSize(i, { stack: Number(e.target.value) })} /></td>
                  <td><input type="number" value={s.reach} onChange={(e) => updateSize(i, { reach: Number(e.target.value) })} /></td>
                  <td><input type="number" step="0.1" value={s.seatTubeAngle} onChange={(e) => updateSize(i, { seatTubeAngle: Number(e.target.value) })} /></td>
                  <td><input type="number" step="0.1" value={s.headTubeAngle} onChange={(e) => updateSize(i, { headTubeAngle: Number(e.target.value) })} /></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSizes((p) => p.filter((_, j) => j !== i))}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="spacer" />
          <div className="flex">
            <button className="btn btn-ghost btn-sm" onClick={() => setSizes((p) => [...p, emptySize()])}>+ Add size</button>
            <button className="btn" onClick={submit} disabled={busy || !brand || !name}>
              {busy ? 'Saving…' : 'Save model'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {models.length === 0 ? (
          <p className="muted">No models yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Brand</th><th>Model</th><th>Discipline</th><th>Sizes</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td>{m.brand}</td>
                  <td><b>{m.name}</b></td>
                  <td><span className="tag">{m.discipline}</span></td>
                  <td>{m.sizes.map((s) => s.sizeLabel).join(', ')}</td>
                  <td>{m.active ? <span className="badge badge-good">active</span> : <span className="badge badge-poor">off</span>}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
