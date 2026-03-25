import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp, PROFILES } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { useAuth } from '../../contexts/AuthContext';

//  SVG Icon System 
const Icon = ({ name, size = 18, color = 'currentColor' }) => {
  const paths = {
    dashboard:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    plus:         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    list:         <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    certificate:  <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="3"/></>,
    check:        <><polyline points="20 6 9 17 4 12"/></>,
    alert:        <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    scale:        <><line x1="12" y1="3" x2="12" y2="21"/><path d="M6 8H2l4-5 4 5H6zM22 16h-4l4 5-4-5h4z"/><path d="M2 16h20"/><path d="M12 3L2 8l10 5 10-5-10-5z"/></>,
    search:       <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    truck:        <><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    package:      <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    scan:         <><path d="M3 7V5a2 2 0 012-2h2"/><path d="M17 3h2a2 2 0 012 2v2"/><path d="M21 17v2a2 2 0 01-2 2h-2"/><path d="M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
    history:      <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
    shield:       <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    users:        <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    logout:       <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chevron_down: <><polyline points="6 9 12 15 18 9"/></>,
    chevron_right:<><polyline points="9 18 15 12 9 6"/></>,
    chevron_left: <><polyline points="15 18 9 12 15 6"/></>,
    gem:          <><polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="6" y2="9"/><line x1="12" y1="3" x2="18" y2="9"/></>,
    verify:       <><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></>,
    sun:          <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>,
    dark:         <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    mining:       <><path d="M2 22l10-10"/><path d="M16 8a2 2 0 11-4 0 2 2 0 014 0z"/><path d="M18 6l2-2"/><path d="M6 18l-2 2"/></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      {paths[name] || paths.dashboard}
    </svg>
  );
};

export { Icon };

//  Nav config 
const NAV_CONFIG = {
  producer: [
    { path: '/producer',              icon: 'dashboard',   key: 'nav.dashboard' },
    { path: '/producer/new-lot',      icon: 'plus',        key: 'nav.new_lot' },
    { path: '/producer/my-lots',      icon: 'list',        key: 'nav.my_lots' },
    { path: '/producer/certificates', icon: 'certificate', key: 'nav.certificates' },
    { path: '/verify',                icon: 'verify',      key: 'nav.verify' },
  ],
  regulator: [
    { path: '/regulator',          icon: 'dashboard', key: 'nav.supervision' },
    { path: '/regulator/lots',     icon: 'list',      key: 'nav.all_lots' },
    { path: '/regulator/alerts',   icon: 'alert',     key: 'nav.alerts' },
    { path: '/regulator/analysis', icon: 'scale',     key: 'nav.analysis' },
    { path: '/regulator/verify',   icon: 'verify',    key: 'nav.verify' },
  ],
  transporter: [
    { path: '/transporter',          icon: 'dashboard', key: 'nav.dashboard' },
    { path: '/transporter/assigned', icon: 'package',   key: 'nav.assigned' },
    { path: '/transporter/scan',     icon: 'scan',      key: 'nav.scan' },
    { path: '/transporter/history',  icon: 'history',   key: 'nav.history' },
  ],
  admin: [
    { path: '/admin', icon: 'users', key: 'nav.admin' },
  ],
};

const ROLE_LABELS = {
  producer: 'nav.role.producer', regulator: 'nav.role.regulator',
  transporter: 'nav.role.transporter', admin: 'nav.role.admin',
};

const ROLE_COLOR = {
  producer: '#1b8a7b', regulator: '#4d6fc9',
  transporter: '#0f776a', admin: '#7b5fc7',
};

// ════════════════════════════════════════════════════════════════════════════
export default function Sidebar({ collapsed, onToggle, isOpen = false }) {
  const { profile, setProfile } = useApp();
  const { t } = useI18n();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (currentUser?.role && currentUser.role !== profile) {
      setProfile(currentUser.role);
    }
  }, [currentUser?.role]);

  const navItems = NAV_CONFIG[profile] || NAV_CONFIG.producer;
  const role     = currentUser?.role || profile;
  const initials = currentUser?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';

  // Teal sidebar background
  const SIDEBAR_BG  = 'linear-gradient(180deg, #103c37 0%, #0a2b28 100%)';
  const ACTIVE_BG   = 'rgba(255,255,255,0.16)';
  const HOVER_BG    = 'rgba(255,255,255,0.08)';
  const TEXT_COLOR  = 'rgba(255,255,255,0.88)';
  const MUTED_COLOR = 'rgba(236,247,245,0.52)';

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} style={{
      width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)',
      background: SIDEBAR_BG,
      height: '100vh',
      position: 'fixed', left: 0, top: 0,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      zIndex: 200,
      boxShadow: '10px 0 30px rgba(6,22,20,0.18)',
    }}>

      {/* ── Logo ──────────────────────────────────────────────── */}
      <div style={{ padding: collapsed ? '20px 16px' : '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, minHeight: 70 }}>
        <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 13, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.24)', boxShadow: '0 8px 18px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="gem" size={18} color="#fff"/>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: '#fff', lineHeight: 1.1 }}>
              MineralChain
            </div>
            <div style={{ fontSize: '0.6rem', color: MUTED_COLOR, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              KATANGA · DRC
            </div>
          </div>
        )}
      </div>

      {/* ── User card ──────────────────────────────────────────── */}
      {currentUser && (
        <div style={{ padding: collapsed ? '12px 10px' : '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: ROLE_COLOR[role] || '#166a52',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em',
              boxShadow: '0 8px 18px rgba(0,0,0,0.16)',
            }}>
              {initials}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '0.65rem', color: MUTED_COLOR, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
                  {currentUser.organization || role}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', background: `${ROLE_COLOR[role]}26`, borderRadius: 10, border: `1px solid ${ROLE_COLOR[role]}38` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_COLOR[role] }}/>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: ROLE_COLOR[role], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t(ROLE_LABELS[role]) || role}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div style={{ padding: '6px 10px 8px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED_COLOR }}>
            {t('nav.navigation')}
          </div>
        )}
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path.split('/').length === 2}
            style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: collapsed ? '11px 13px' : '10px 12px',
                borderRadius: 14,
                background: isActive ? ACTIVE_BG : 'transparent',
                color: isActive ? '#fff' : TEXT_COLOR,
                fontSize: '0.845rem', fontWeight: isActive ? 600 : 400,
                transition: 'all 0.18s ease', cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
                border: isActive ? '1px solid rgba(255,255,255,0.16)' : '1px solid transparent',
                boxShadow: isActive ? '0 10px 22px rgba(0,0,0,0.14)' : 'none',
              }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = HOVER_BG;
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <Icon name={item.icon} size={17} color={isActive ? '#fff' : TEXT_COLOR}/>
                {!collapsed && <span>{t(item.key)}</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Status bar ─────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2aab88', boxShadow: '0 0 6px #2aab88', animation: 'pulse 2s infinite' }}/>
            <div>
              <div style={{ fontSize: '0.7rem', color: TEXT_COLOR, fontWeight: 500 }}>{t('app.system_active')}</div>
              <div style={{ fontSize: '0.6rem', color: MUTED_COLOR }}>Ganache · localhost:7545</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout ─────────────────────────────────────────────── */}
      <button onClick={handleLogout} style={{
        padding: collapsed ? '12px' : '11px 16px',
        background: 'transparent', border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        color: MUTED_COLOR, cursor: 'pointer',
        fontSize: '0.78rem', fontFamily: 'var(--font-body)',
        display: 'flex', alignItems: 'center',
        gap: 9, transition: 'all 0.15s',
        justifyContent: collapsed ? 'center' : 'flex-start',
        width: '100%',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.15)'; e.currentTarget.style.color = '#e05c4b'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED_COLOR; }}
      >
        <Icon name="logout" size={16} color="currentColor"/>
        {!collapsed && <span>{t('action.logout') || 'Déconnexion'}</span>}
      </button>

      {/* ── Collapse toggle ─────────────────────────────────────── */}
      <button onClick={onToggle} style={{
        padding: '12px', background: 'rgba(255,255,255,0.06)',
        border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
        color: MUTED_COLOR, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', width: '100%',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      >
        <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={16} color={MUTED_COLOR}/>
      </button>
    </aside>
  );
}
