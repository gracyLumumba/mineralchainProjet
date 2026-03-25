import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './styles/global.css';

import { AppProvider }  from './contexts/AppContext';
import { I18nProvider } from './contexts/i18nContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Sidebar from './components/layout/Sidebar';
import { NotifProvider }   from './contexts/NotifContext';
import { ToastContainer, NOTIF_CSS } from './components/notifications/NotifComponents';
import { AppHeader } from './components/layout/Header';
import AuthPage from './pages/auth/AuthPage';

// Public
import PublicVerifyPage from './components/common/PublicVerifyPage';

// Producer
import NewLotPage  from './pages/producer/NewLotPage';
import LotDetailPage from './pages/producer/LotDetailPage';
import { ProducerDashboard, MyLotsPage, CertificatesPage } from './pages/producer/ProducerPages';

// Regulator
import { RegulatorDashboard, RegulatorLotsPage, AlertsPage, RegulatorVerifyPage } from './pages/regulator/RegulatorPages';
import RegulatorAnalysisPage from './pages/regulator/RegulatorAnalysisPage';

// Admin
import AdminPage       from './pages/admin/AdminPage';

// Transporter
import { TransporterDashboard, AssignedLotsPage, QRScannerPage, TransportHistoryPage } from './pages/transporter/TransporterPages';

// ── Authenticated layout ────────────────────────────────────────────────────
function AuthenticatedApp() {
  const { currentUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const defaultRoute = {
    producer:    '/producer',
    regulator:   '/regulator',
    transporter: '/transporter',
    admin:       '/admin',
  }[currentUser?.role] || '/producer';

  useEffect(() => {
    const path = location.pathname || '/';
    const isActorRoute = (
      path === '/' ||
      path.startsWith('/producer') ||
      path.startsWith('/regulator') ||
      path.startsWith('/transporter') ||
      path.startsWith('/admin')
    );

    if (!isActorRoute) return;
    if (path === defaultRoute || path.startsWith(`${defaultRoute}/`)) return;
    navigate(defaultRoute, { replace: true });
  }, [defaultRoute, location.pathname, navigate]);

  const ml = collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)';

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)}/>
      <div className="main-area" style={{ marginLeft: ml, transition: 'margin-left 0.3s' }}>
        <AppHeader sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed(c => !c)}/>
        <Routes>
          <Route path="/"                        element={<Navigate to={defaultRoute} replace/>}/>
          {/* Producer */}
          <Route path="/producer"              element={<ProducerDashboard/>}/>
          <Route path="/producer/new-lot"      element={<NewLotPage/>}/>
          <Route path="/producer/my-lots"      element={<MyLotsPage/>}/>
          <Route path="/producer/lot/:id"      element={<LotDetailPage/>}/>
          <Route path="/producer/certificates" element={<CertificatesPage/>}/>
          {/* Regulator */}
          <Route path="/regulator"             element={<RegulatorDashboard/>}/>
          <Route path="/regulator/lots"        element={<RegulatorLotsPage/>}/>
          <Route path="/regulator/alerts"      element={<AlertsPage/>}/>
          <Route path="/regulator/verify"      element={<RegulatorVerifyPage/>}/>
          <Route path="/regulator/analysis"    element={<RegulatorAnalysisPage/>}/>
          {/* Transporter */}
          <Route path="/transporter"           element={<TransporterDashboard/>}/>
          <Route path="/transporter/assigned"  element={<AssignedLotsPage/>}/>
          <Route path="/transporter/scan"      element={<QRScannerPage/>}/>
          <Route path="/transporter/history"   element={<TransportHistoryPage/>}/>
          {/* Admin */}
          <Route path="/admin"               element={<AdminPage/>}/>
          <Route path="/admin/users"         element={<AdminPage/>}/>
          <Route path="/admin/transactions"  element={<AdminPage/>}/>
          {/* Fallback */}
          <Route path="*" element={<Navigate to={defaultRoute} replace/>}/>
        </Routes>
        <ToastContainer/>
      </div>
    </div>
  );
}

// ── Root routing — public /verify is OUTSIDE auth ──────────────────────────
function AppRouter() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* PUBLIC — no login needed (QR scan from phone) */}
      <Route path="/verify" element={<PublicVerifyPage/>}/>
      {/* PRIVATE — all other routes */}
      <Route path="/*" element={
        isAuthenticated ? <AuthenticatedApp/> : <AuthPage/>
      }/>
    </Routes>
  );
}

// ── App root ──────────────────────────────────────────────────────────────
export default function App() {
  // Inject notification CSS animations
  if (!document.getElementById('notif-css')) {
    const s = document.createElement('style');
    s.id = 'notif-css';
    s.textContent = NOTIF_CSS;
    document.head.appendChild(s);
  }

  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppProvider>
            <NotifProvider>
            <BrowserRouter>
              <AppRouter/>
            </BrowserRouter>
            </NotifProvider>
          </AppProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
