import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/auth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { FitStudioPage } from './pages/FitStudio';
import { CatalogPage } from './pages/Catalog';
import { SessionsPage } from './pages/Sessions';
import { SettingsPage } from './pages/Settings';
import { OverviewPage } from './pages/Overview';

export function App() {
  const { user, initialized, init } = useAuth();

  useEffect(() => {
    void init();
  }, [init]);

  if (!initialized) {
    return <div className="loading">Loading FitWerx…</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/studio" element={<FitStudioPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
