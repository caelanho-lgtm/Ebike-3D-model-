import { useEffect, useState } from 'react';
import { api, type SessionDetail, type SessionSummary } from '../api/client';

const badge: Record<string, string> = {
  excellent: 'badge badge-excellent', good: 'badge badge-good',
  fair: 'badge badge-fair', poor: 'badge badge-poor',
};

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  useEffect(() => {
    api.listSessions().then(setSessions).catch(() => undefined);
  }, []);

  const open = async (id: string) => {
    const d = await api.getSession(id).catch(() => null);
    setDetail(d);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Fit sessions</h1>
          <p className="page-sub">History of fits run in the studio and through the widget.</p>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          {sessions.length === 0 ? (
            <p className="muted">No sessions recorded yet.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Rider</th><th>Source</th><th>Date</th></tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => open(s.id)}>
                    <td><b>{s.customerName ?? 'Anonymous'}</b><div className="faint" style={{ fontSize: 12 }}>{s.customerEmail}</div></td>
                    <td><span className="tag">{s.source}</span></td>
                    <td className="faint">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          {!detail ? (
            <p className="muted">Select a session to see its fit and recommendations.</p>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>{detail.customerName ?? 'Anonymous rider'}</h3>
              <div className="grid cols-3" style={{ gap: 10, marginBottom: 14 }}>
                <div className="stat"><span className="stat-value">{detail.fit.saddleHeight}</span><span className="stat-label">Saddle mm</span></div>
                <div className="stat"><span className="stat-value">{detail.fit.targetReach}</span><span className="stat-label">Reach mm</span></div>
                <div className="stat"><span className="stat-value">{detail.fit.targetStack}</span><span className="stat-label">Stack mm</span></div>
              </div>
              {detail.recommendations.slice(0, 5).map((r) => (
                <div key={r.modelId} className="flex-between" style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <span>{r.brand} {r.name} <span className="faint">· {r.bestSize.sizeLabel}</span></span>
                  <span className={badge[r.confidence]}>{r.bestSize.score}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
