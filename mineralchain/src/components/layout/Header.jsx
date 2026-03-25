import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotifBell } from '../notifications/NotifComponents';
import { Icon } from './Sidebar';

//  Language Switcher 
export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.72)', borderRadius:'var(--r-md)', padding:3, border:'1px solid var(--border-soft)', boxShadow:'var(--shadow-xs)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
      {[['fr','FR'],['en','EN']].map(([l,label]) => (
        <button key={l} onClick={()=>setLang(l)} style={{
          padding:'5px 11px', borderRadius:10, border:'none', cursor:'pointer',
          background: lang===l ? 'var(--brand)' : 'transparent',
          color: lang===l ? '#fff' : 'var(--text-muted)',
          fontWeight: lang===l ? 700 : 500, fontSize:'0.75rem', fontFamily:'var(--font-body)',
          transition:'all 0.18s ease',
        }}>{label}</button>
      ))}
    </div>
  );
}

//  Theme Switcher 
function ThemeSwitcherInline() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);

  const opts = [
    { v:'light', icon:<SunIcon/>,    label:'Light'  },
    { v:'dark',  icon:<MoonIcon/>,   label:'Dark'   },
    { v:'system',icon:<MonitorIcon/>,label:'System' },
  ];
  const cur = opts.find(o=>o.v===mode)||opts[0];

  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(!open)} style={{
        display:'flex', alignItems:'center', gap:6, padding:'7px 12px',
        background:'rgba(255,255,255,0.74)', border:'1px solid var(--border-soft)',
        borderRadius:'var(--r-md)', color:'var(--text-secondary)', cursor:'pointer',
        fontSize:'0.78rem', fontFamily:'var(--font-body)', fontWeight:500, transition:'all 0.18s ease',
        boxShadow:'var(--shadow-xs)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
      }}>
        {cur.icon}
        <span style={{ fontSize:'0.75rem' }}>{cur.label}</span>
        <ChevronIcon/>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--bg-card)', border:'1px solid var(--border-soft)', borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-lg)', overflow:'hidden', zIndex:1000, minWidth:130, backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)' }}>
          {opts.map(o => (
            <button key={o.v} onClick={()=>{setMode(o.v);setOpen(false);}} style={{
              display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 14px',
              background: mode===o.v?'var(--brand-dim)':'transparent', border:'none', cursor:'pointer',
              color: mode===o.v?'var(--brand)':'var(--text-secondary)',
              fontSize:'0.82rem', fontFamily:'var(--font-body)', fontWeight:mode===o.v?600:400,
              transition:'background 0.1s',
            }}>
              {o.icon}<span>{o.label}</span>
              {mode===o.v && <span style={{marginLeft:'auto',color:'var(--brand)',fontSize:11}}>&#10003;</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Mini SVG icons for theme switcher
const SunIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const MonitorIcon= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const ChevronIcon= () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>;
const BellIcon   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;

//  Toast 
// ToastContainer now lives in NotifComponents
export { ToastContainer } from '../notifications/NotifComponents';

//  App Header 
export function AppHeader() {
  const { profile, stats } = useApp();
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [showUser, setShowUser] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const pageTitles = {
    producer: t('header.producer') || 'Producer Dashboard',
    regulator: t('header.regulator') || 'Regulator Supervision',
    transporter: t('header.transporter') || 'Transport Management',
    admin: 'System Administration',
  };

  const initials = currentUser?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'??';

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'rgba(255,255,255,0.76)',
      borderBottom: '1px solid var(--border-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
      boxShadow: 'var(--shadow-xs)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
    }}>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileNav(m => !m)}
        className="btn-icon mobile-menu-btn"
        style={{ display:'none', marginRight:8 }}
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Left — page title */}
      <div>
        <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)' }}>
          {pageTitles[profile]}
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:1 }}>
          {stats.total_lots} {t('app.lots')} · {stats.total_tokens} NFTs · {stats.auth_rate}% {t('stat.auth_rate')}
        </div>
      </div>

      {/* Right — controls */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {/* System status */}
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 13px', background:'rgba(255,255,255,0.68)', borderRadius:'var(--r-md)', border:'1px solid var(--border-soft)', boxShadow:'var(--shadow-xs)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--emerald)', boxShadow:'0 0 5px var(--emerald)', animation:'pulse 2.5s infinite' }}/>
          <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
            0xE7A5...9Fbb
          </span>
        </div>

        {/* Theme */}
        <ThemeSwitcherInline/>

        {/* Language */}
        <LanguageSwitcher/>

        {/* Notification bell + panel */}
        <NotifBell/>

        {/* User avatar */}
        {currentUser && (
          <div style={{ position:'relative' }}>
            <button onClick={()=>setShowUser(s=>!s)} style={{
              display:'flex', alignItems:'center', gap:9, padding:'5px 10px 5px 7px',
              background:'rgba(255,255,255,0.68)', border:'1px solid var(--border-soft)',
              borderRadius:'var(--r-md)', cursor:'pointer', transition:'all 0.15s',
              boxShadow:'var(--shadow-xs)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
            }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--brand)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-soft)'}
            >
              <div style={{
                width:30, height:30, borderRadius:'50%', flexShrink:0,
                background:'var(--brand)', color:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.72rem', fontWeight:700,
              }}>{initials}</div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-primary)', lineHeight:1.1 }}>
                  {currentUser.full_name?.split(' ')[0]}
                </div>
                <div style={{ fontSize:'0.63rem', color:'var(--brand)', lineHeight:1, marginTop:2 }}>
                  {currentUser.role}
                </div>
              </div>
              <ChevronIcon/>
            </button>

            {showUser && (
              <div style={{ position:'absolute', top:'calc(100%+8px)', right:0, background:'var(--bg-card)', border:'1px solid var(--border-soft)', borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-lg)', zIndex:300, minWidth:220, overflow:'hidden', marginTop:6, backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-dim)', background:'var(--brand-dim)' }}>
                  <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.88rem' }}>{currentUser.full_name}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>{currentUser.email}</div>
                  <div style={{ fontSize:'0.65rem', fontFamily:'var(--font-mono)', color:'var(--brand)', marginTop:4, padding:'2px 8px', background:'var(--brand-mid)', borderRadius:4, display:'inline-block' }}>
                    {currentUser.wallet?.slice(0,12)}…
                  </div>
                </div>
                <div style={{ padding:'8px' }}>
                  <div style={{ padding:'8px 10px', fontSize:'0.8rem', color:'var(--text-muted)' }}>
                    <span style={{ color:'var(--brand)', fontWeight:600 }}>{currentUser.organization}</span>
                  </div>
                  <div style={{ padding:'8px 10px', fontSize:'0.75rem', color:'var(--text-muted)' }}>
                    {(currentUser.permissions||[]).join(' · ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
