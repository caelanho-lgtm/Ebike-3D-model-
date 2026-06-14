import { useEffect, useMemo, useState } from 'react';
import type {
  BikeModelDto,
  Discipline,
  RecommendResponse,
} from '@fitwerx/shared';
import { api, ApiClientError } from '../api/client';
import { BikeViewer } from '../components/BikeViewer';
import { ErrorBoundary } from '../components/ErrorBoundary';

const DISCIPLINES: { value: Discipline; label: string }[] = [
  { value: 'road_race', label: 'Road — Race' },
  { value: 'road_endurance', label: 'Road — Endurance' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'mtb_xc', label: 'MTB — Cross-Country' },
  { value: 'mtb_trail', label: 'MTB — Trail' },
  { value: 'tt_triathlon', label: 'Time Trial / Tri' },
  { value: 'commute_city', label: 'Commute / City' },
];

const confidenceBadge: Record<string, string> = {
  excellent: 'badge badge-excellent',
  good: 'badge badge-good',
  fair: 'badge badge-fair',
  poor: 'badge badge-poor',
};

function scoreColor(score: number): string {
  if (score >= 88) return '#22c55e';
  if (score >= 74) return '#38bdf8';
  if (score >= 58) return '#f59e0b';
  return '#ef4444';
}

const FIT_FIELDS: { key: keyof RecommendResponse['fit']; label: string; unit: string }[] = [
  { key: 'saddleHeight', label: 'Saddle height', unit: 'mm' },
  { key: 'saddleSetback', label: 'Saddle setback', unit: 'mm' },
  { key: 'handlebarReach', label: 'Bar reach', unit: 'mm' },
  { key: 'handlebarDrop', label: 'Bar drop', unit: 'mm' },
  { key: 'crankLength', label: 'Crank length', unit: 'mm' },
  { key: 'handlebarWidth', label: 'Bar width', unit: 'mm' },
  { key: 'saddleWidth', label: 'Saddle width', unit: 'mm' },
  { key: 'effectiveSeatAngle', label: 'Seat angle', unit: '°' },
];

export function FitStudioPage() {
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [discipline, setDiscipline] = useState<Discipline>('road_endurance');
  const [flexibility, setFlexibility] = useState<'low' | 'medium' | 'high'>('medium');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced' | 'pro'>(
    'intermediate',
  );
  const [height, setHeight] = useState('180');
  const [inseam, setInseam] = useState('84');
  const [torso, setTorso] = useState('');
  const [armLength, setArmLength] = useState('');
  const [age, setAge] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [models, setModels] = useState<BikeModelDto[]>([]);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.listModels().then(setModels).catch(() => undefined);
  }, []);

  const modelMap = useMemo(
    () => new Map(models.map((m) => [m.id, m])),
    [models],
  );

  const selectedRec = useMemo(
    () => result?.recommendations.find((r) => r.modelId === selectedModelId) ?? result?.recommendations[0],
    [result, selectedModelId],
  );

  const selectedGeometry = useMemo(() => {
    if (!selectedRec) return null;
    const model = modelMap.get(selectedRec.modelId);
    return model?.sizes.find((s) => s.sizeLabel === selectedRec.bestSize.sizeLabel) ?? null;
  }, [selectedRec, modelMap]);

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

  const run = async (persist: boolean) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.recommend({
        rider: {
          units,
          measurements: {
            height: Number(height),
            inseam: num(inseam),
            torso: num(torso),
            armLength: num(armLength),
          },
          profile: { discipline, flexibility, experience, age: num(age), sex: 'unspecified' },
        },
        persist,
        customerName: customerName || undefined,
      });
      setResult(res);
      setSelectedModelId(res.recommendations[0]?.modelId ?? null);
      if (persist && res.sessionId) setSaved(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Recommendation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Fit Studio</h1>
          <p className="page-sub">Capture rider measurements and generate an AI-driven fit + bike match.</p>
        </div>
      </div>

      <div className="grid cols-2">
        {/* Input panel */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Rider</h3>
          <div className="field-row">
            <div className="field">
              <label>Units</label>
              <select value={units} onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}>
                <option value="metric">Metric (cm)</option>
                <option value="imperial">Imperial (in)</option>
              </select>
            </div>
            <div className="field">
              <label>Discipline</label>
              <select value={discipline} onChange={(e) => setDiscipline(e.target.value as Discipline)}>
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Height *</label>
              <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" />
            </div>
            <div className="field">
              <label>Inseam</label>
              <input value={inseam} onChange={(e) => setInseam(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Torso (optional)</label>
              <input value={torso} onChange={(e) => setTorso(e.target.value)} inputMode="decimal" />
            </div>
            <div className="field">
              <label>Arm length (optional)</label>
              <input value={armLength} onChange={(e) => setArmLength(e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Flexibility</label>
              <select value={flexibility} onChange={(e) => setFlexibility(e.target.value as typeof flexibility)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="field">
              <label>Experience</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value as typeof experience)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Age (optional)</label>
              <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" />
            </div>
            <div className="field">
              <label>Customer name (optional)</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {saved && <div className="alert alert-ok">Session saved.</div>}

          <div className="flex">
            <button className="btn" onClick={() => run(false)} disabled={loading || !height}>
              {loading ? 'Computing…' : 'Compute fit'}
            </button>
            <button className="btn btn-ghost" onClick={() => run(true)} disabled={loading || !height}>
              Compute & save session
            </button>
          </div>
          {models.length === 0 && (
            <p className="faint" style={{ fontSize: 12, marginTop: 12 }}>
              No bike models yet — add some in Catalog to get ranked recommendations.
            </p>
          )}
        </div>

        {/* Fit coordinates */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ideal fit coordinates</h3>
          {!result ? (
            <p className="muted">Run a fit to see the rider's biomechanical targets.</p>
          ) : (
            <>
              <div className="grid cols-2" style={{ gap: 12 }}>
                {FIT_FIELDS.map((f) => (
                  <div className="stat" key={f.key}>
                    <span className="stat-value">
                      {result.fit[f.key]}
                      <span className="faint" style={{ fontSize: 13, fontWeight: 500 }}> {f.unit}</span>
                    </span>
                    <span className="stat-label">{f.label}</span>
                  </div>
                ))}
              </div>
              {result.estimatedFields.length > 0 && (
                <p className="faint" style={{ fontSize: 12, marginTop: 14 }}>
                  Estimated from height: {result.estimatedFields.join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {result && selectedRec && selectedGeometry && (
        <>
          <div className="spacer" />
          <div className="grid cols-2">
            <div className="card" style={{ padding: 0 }}>
              <div className="viewer">
                <ErrorBoundary
                  fallback={
                    <div className="loading" style={{ paddingTop: 200 }}>
                      3D preview unavailable in this browser (WebGL required).
                    </div>
                  }
                >
                  <BikeViewer geometry={selectedGeometry} fit={result.fit} />
                </ErrorBoundary>
              </div>
              <div style={{ padding: 16 }}>
                <div className="flex-between">
                  <div>
                    <b>{selectedRec.brand} {selectedRec.name}</b>
                    <div className="faint" style={{ fontSize: 13 }}>
                      Size {selectedRec.bestSize.sizeLabel} · stem {selectedRec.bestSize.recommendedStemLength}mm @ {selectedRec.bestSize.recommendedStemAngle}° · {selectedRec.bestSize.recommendedSpacerStack}mm spacers
                    </div>
                  </div>
                  <span className={confidenceBadge[selectedRec.confidence]}>{selectedRec.confidence}</span>
                </div>
                {selectedRec.bestSize.notes.length > 0 && (
                  <ul className="faint" style={{ fontSize: 12.5, marginBottom: 0, paddingLeft: 18 }}>
                    {selectedRec.bestSize.notes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Ranked matches</h3>
              {result.recommendations.length === 0 && <p className="muted">No models to rank.</p>}
              {result.recommendations.map((rec) => {
                const selected = rec.modelId === selectedRec.modelId;
                return (
                  <div
                    key={rec.modelId}
                    className={`recommend-row${selected ? ' selected' : ''}`}
                    onClick={() => setSelectedModelId(rec.modelId)}
                  >
                    <div
                      className="score-ring"
                      style={{ border: `3px solid ${scoreColor(rec.bestSize.score)}`, color: scoreColor(rec.bestSize.score) }}
                    >
                      {rec.bestSize.score}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between">
                        <b>{rec.brand} {rec.name}</b>
                        <span className={confidenceBadge[rec.confidence]}>{rec.confidence}</span>
                      </div>
                      <div className="faint" style={{ fontSize: 12.5 }}>
                        Best size {rec.bestSize.sizeLabel} · Δreach {rec.bestSize.residuals.reachError}mm · Δstack {rec.bestSize.residuals.stackError}mm
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
