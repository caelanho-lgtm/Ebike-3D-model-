import { useState } from 'react';
import { useAuth } from '../store/auth';
import { ApiClientError } from '../api/client';

export function LoginPage() {
  const { login, signup, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('owner@demovelo.cc');
  const [password, setPassword] = useState('ChangeMe123!');
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup({ tenantName, tenantSlug, email, password, name });
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand" style={{ marginBottom: 22 }}>
          <div className="brand-mark">F</div>
          <div>
            <div className="brand-name">FitWerx Studio</div>
            <div className="brand-sub">Bicycle fitting · 3D · AI sizing</div>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign in
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Create workspace
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <div className="field">
                <label>Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Workspace name</label>
                  <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Slug</label>
                  <input
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value.toLowerCase())}
                    placeholder="my-shop"
                    required
                  />
                </div>
              </div>
            </>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create workspace'}
          </button>
        </form>

        {mode === 'login' && (
          <p className="faint" style={{ fontSize: 12, marginTop: 14 }}>
            Demo: <span className="mono">owner@demovelo.cc</span> / <span className="mono">ChangeMe123!</span>
          </p>
        )}
      </div>
    </div>
  );
}
