import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type SessionSummary } from '../api/client';
import { useAuth } from '../store/auth';
import type { BikeModelDto } from '@fitwerx/shared';

export function OverviewPage() {
  const { user } = useAuth();
  const [models, setModels] = useState<BikeModelDto[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    api.listModels().then(setModels).catch(() => undefined);
    api.listSessions().then(setSessions).catch(() => undefined);
  }, []);

  const activeModels = models.filter((m) => m.active).length;
  const disciplines = new Set(models.map((m) => m.discipline)).size;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="page-sub">Your fitting workspace at a glance.</p>
        </div>
        <Link className="btn" to="/studio">Start a fit</Link>
      </div>

      <div className="grid cols-3">
        <div className="card stat">
          <span className="stat-value">{models.length}</span>
          <span className="stat-label">Bike models ({activeModels} active)</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{disciplines}</span>
          <span className="stat-label">Disciplines covered</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{sessions.length}</span>
          <span className="stat-label">Saved fit sessions</span>
        </div>
      </div>

      <div className="spacer" />
      <div className="grid cols-2">
        <div className="card">
          <div className="flex-between">
            <h3 style={{ margin: 0 }}>Recent sessions</h3>
            <Link className="faint" to="/sessions">View all</Link>
          </div>
          <div className="spacer" />
          {sessions.length === 0 ? (
            <p className="muted">No sessions yet. Run a fit in the studio.</p>
          ) : (
            <table>
              <tbody>
                {sessions.slice(0, 6).map((s) => (
                  <tr key={s.id}>
                    <td>{s.customerName ?? 'Anonymous rider'}</td>
                    <td><span className="tag">{s.source}</span></td>
                    <td className="faint">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Get started</h3>
          <ol className="muted" style={{ lineHeight: 1.9, paddingLeft: 18 }}>
            <li>Add your bike models &amp; geometry in <Link to="/catalog">Catalog</Link>.</li>
            <li>Run fits in the <Link to="/studio">Fit Studio</Link> with 3D visualization.</li>
            <li>Embed the widget on your storefront from <Link to="/settings">Settings</Link>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
