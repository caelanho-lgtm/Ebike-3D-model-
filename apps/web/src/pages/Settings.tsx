import { useEffect, useState } from 'react';
import type { TenantDto } from '@fitwerx/shared';
import { api, ApiClientError, type ApiKeySummary } from '../api/client';
import { useAuth } from '../store/auth';

export function SettingsPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#0EA5E9');
  const [logoUrl, setLogoUrl] = useState('');

  const load = async () => {
    const t = await api.getTenant().catch(() => null);
    if (t) {
      setTenant(t);
      setName(t.name);
      setColor(t.primaryColor);
      setLogoUrl(t.logoUrl ?? '');
    }
    await api.listApiKeys().then(setKeys).catch(() => undefined);
  };
  useEffect(() => { void load(); }, []);

  const saveBranding = async () => {
    setErr(null); setMsg(null);
    try {
      await api.updateTenant({ name, primaryColor: color, logoUrl: logoUrl || null });
      setMsg('Branding saved.');
      await load();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : 'Save failed');
    }
  };

  const createKey = async () => {
    setNewKey(null);
    const res = await api.createApiKey('Widget key').catch(() => null);
    if (res) { setNewKey(res.key); await load(); }
  };

  const revoke = async (id: string) => {
    await api.revokeApiKey(id).catch(() => undefined);
    await load();
  };

  const origin = window.location.origin;
  const embed = `<div id="fitwerx-widget"></div>
<script src="${origin}/widget/fitwerx-widget.js"
  data-tenant="${tenant?.slug ?? user?.tenantSlug ?? ''}"
  data-api-key="YOUR_PUBLIC_API_KEY"
  data-api-base="${origin}">
</script>`;

  const canManage = user && ['admin', 'owner'].includes(user.role);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Branding, API keys, and the embeddable widget.</p>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Branding</h3>
          {msg && <div className="alert alert-ok">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <div className="field"><label>Workspace name</label><input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} /></div>
          <div className="field-row">
            <div className="field"><label>Primary color</label><input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={!canManage} /></div>
            <div className="field"><label>Logo URL</label><input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} disabled={!canManage} placeholder="https://…" /></div>
          </div>
          <button className="btn" onClick={saveBranding} disabled={!canManage}>Save branding</button>
          {!canManage && <p className="faint" style={{ fontSize: 12 }}>Admin or owner role required to edit.</p>}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>API keys</h3>
          <p className="faint" style={{ fontSize: 13, marginTop: 0 }}>Public keys authorize the embeddable widget to run fits for your storefront.</p>
          {newKey && (
            <div className="alert alert-ok">
              <div style={{ marginBottom: 6 }}>Copy this key now — it won't be shown again:</div>
              <div className="mono" style={{ wordBreak: 'break-all' }}>{newKey}</div>
            </div>
          )}
          {canManage && <button className="btn btn-sm" onClick={createKey}>+ Generate key</button>}
          <div className="spacer" />
          {keys.length === 0 ? <p className="muted">No keys yet.</p> : (
            <table>
              <thead><tr><th>Key</th><th>Last used</th><th /></tr></thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{k.maskedKey}{k.revokedAt && <span className="badge badge-poor" style={{ marginLeft: 8 }}>revoked</span>}</td>
                    <td className="faint">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}</td>
                    <td>{canManage && !k.revokedAt && <button className="btn btn-danger btn-sm" onClick={() => revoke(k.id)}>Revoke</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="spacer" />
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Embed the widget</h3>
        <p className="faint" style={{ fontSize: 13, marginTop: 0 }}>
          Paste this snippet into any brand or shop website. It renders the full fit flow with 3D preview and posts results to your workspace.
        </p>
        <div className="code-block">{embed}</div>
      </div>
    </div>
  );
}
