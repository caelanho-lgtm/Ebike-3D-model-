import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/auth';

const NAV = [
  { to: '/', label: 'Overview', icon: '◫' },
  { to: '/studio', label: 'Fit Studio', icon: '◎' },
  { to: '/catalog', label: 'Catalog', icon: '▤' },
  { to: '/sessions', label: 'Sessions', icon: '≣' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <div className="brand-name">FitWerx</div>
            <div className="brand-sub">{user?.tenantSlug}</div>
          </div>
        </div>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span aria-hidden style={{ width: 18, textAlign: 'center' }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <div className="sidebar-footer">
          <div className="user-chip">
            <b>{user?.name}</b>
            {user?.email}
          </div>
          <div className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: '100%' }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
