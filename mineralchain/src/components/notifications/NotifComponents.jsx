import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotif, NOTIF_CONFIG } from '../../contexts/NotifContext';
import { useI18n } from '../../contexts/i18nContext';

// ── SVG icons inline ─────────────────────────────────────────────────────────
function Ic({ name, size = 16, color = 'currentColor' }) {
  const paths = {
    bell:     <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    check:    <polyline points="20 6 9 17 4 12"/>,
    x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    alert:    <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    gem:      <><polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="6" y2="9"/><line x1="12" y1="3" x2="18" y2="9"/></>,
    cloud:    <><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></>,
    chain:    <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    robot:    <><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 7V3"/><circle cx="12" cy="7" r="2"/><path d="M9 14h.01M15 14h.01"/></>,
    scale:    <><line x1="12" y1="3" x2="12" y2="21"/><path d="M6 8H2l4-5 4 5H6z"/><path d="M22 16h-4l4 5-4-5h4z"/><path d="M2 16h20"/></>,
    shield:   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    truck:    <><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    package:  <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    users:    <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    factory:  <><path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7 5V8l-7 5V4a2 2 0 00-2-2H4a2 2 0 00-2 2z"/></>,
    delivery: <><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2" ry="2"/><path d="M16 16l2 2 4-4"/></>,
    trash:    <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
    checkall: <><polyline points="20 6 9 17 4 12"/><polyline points="20 12 9 23 4 18"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
      {paths[name] || paths.bell}
    </svg>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────────
function relTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5)   return "à l'instant";
  if (diff < 60)  return `il y a ${diff}s`;
  if (diff < 3600)return `il y a ${Math.floor(diff/60)}min`;
  if (diff < 86400)return `il y a ${Math.floor(diff/3600)}h`;
  return `il y a ${Math.floor(diff/86400)}j`;
}

// ── Category label ────────────────────────────────────────────────────────────
const CAT_LABELS = {
  lot: 'Lot', validation: 'Validation', alert: 'Alerte',
  blockchain: 'Blockchain', ipfs: 'IPFS', transport: 'Transport',
  admin: 'Admin', system: 'Système', action: 'Action requise',
};

// ═════════════════════════════════════════════════════════════════════════════
//  TOAST — notification push style téléphone
// ═════════════════════════════════════════════════════════════════════════════
function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const [swiped, setSwiped]   = useState(false);
  const startX = useRef(null);
  const elRef  = useRef(null);

  // Couleur + icône par type
  const cfg = {
    success: { color: '#047857', bg: 'rgba(4,120,87,0.08)',   border: 'rgba(4,120,87,0.2)',   icon: 'check'  },
    error:   { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)',  icon: 'alert'  },
    warning: { color: '#b45309', bg: 'rgba(180,83,9,0.08)',   border: 'rgba(180,83,9,0.2)',   icon: 'alert'  },
    info:    { color: '#1a5fa0', bg: 'rgba(26,95,160,0.08)',  border: 'rgba(26,95,160,0.2)',  icon: 'info'   },
    blockchain:{ color:'#b8860b', bg:'rgba(184,134,11,0.08)', border:'rgba(184,134,11,0.2)',  icon: 'chain'  },
  }[toast.type] || { color:'#1a5fa0', bg:'rgba(26,95,160,0.08)', border:'rgba(26,95,160,0.2)', icon:'info' };

  // Swipe-to-dismiss (touch)
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => {
    if (startX.current === null || !elRef.current) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx > 20) elRef.current.style.transform = `translateX(${dx}px)`;
  };
  const onTouchEnd = (e) => {
    if (!elRef.current) return;
    const dx = e.changedTouches[0].clientX - (startX.current || 0);
    startX.current = null;
    if (dx > 80) {
      setSwiped(true);
      setTimeout(() => onDismiss(toast.id), 200);
    } else {
      elRef.current.style.transform = '';
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={elRef}
      role="alert"
      aria-live="polite"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 200); }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '13px 15px 13px 13px',
        background: 'var(--bg-raised)',
        border: `1px solid ${cfg.border}`,
        borderLeft: `3.5px solid ${cfg.color}`,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        minWidth: 300, maxWidth: 400,
        cursor: 'pointer',
        opacity: swiped ? 0 : 1,
        transform: swiped ? 'translateX(120%)' : 'none',
        transition: 'opacity 0.2s, transform 0.2s',
        WebkitUserSelect: 'none', userSelect: 'none',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Icon bubble */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ic name={cfg.icon} size={15} color={cfg.color}/>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.85rem', fontWeight: 600,
          color: 'var(--text-primary)', lineHeight: 1.3,
          marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {relTime(toast.ts)} · Appuyez pour fermer
        </div>
      </div>

      {/* Close */}
      <button onClick={e => { e.stopPropagation(); onDismiss(toast.id); }}
        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:2, flexShrink:0 }}>
        <Ic name="x" size={14} color="var(--text-muted)"/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOAST CONTAINER — position iOS/Android (top-right sur desktop, top sur mobile)
// ─────────────────────────────────────────────────────────────────────────────
export function ToastContainer() {
  const { toasts, dismissToast } = useNotif();

  return (
    <div style={{
      position: 'fixed',
      top: 'max(76px, env(safe-area-inset-top, 0px) + 76px)',
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
      maxWidth: 420,
      width: 'calc(100vw - 40px)',
    }}>
      {toasts.map((toast, i) => (
        <div key={toast.id}
          style={{
            pointerEvents: 'all',
            animation: `slideInFromRight 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.04}s both`,
          }}>
          <Toast toast={toast} onDismiss={dismissToast}/>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION ITEM — dans le panneau
// ═════════════════════════════════════════════════════════════════════════════
function NotifItem({ notif, onRead, onDelete }) {
  const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG['system_alert'];

  return (
    <div
      onClick={() => !notif.read && onRead(notif.id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '13px 16px',
        background: notif.read ? 'transparent' : 'var(--brand-dim)',
        borderBottom: '1px solid var(--border-dim)',
        cursor: notif.read ? 'default' : 'pointer',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = notif.read ? 'transparent' : 'var(--brand-dim)'; }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div style={{
          position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--brand)',
        }}/>
      )}

      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: `${cfg.color}15`,
        border: `1px solid ${cfg.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ic name={cfg.icon} size={16} color={cfg.color}/>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.83rem', fontWeight: notif.read ? 500 : 700,
          color: 'var(--text-primary)', lineHeight: 1.35,
          marginBottom: 3,
        }}>
          {notif.title}
        </div>
        {notif.body && (
          <div style={{
            fontSize: '0.76rem', color: 'var(--text-secondary)',
            lineHeight: 1.4, marginBottom: 4,
          }}>
            {notif.body}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.65rem', padding: '1px 7px', borderRadius: 99,
            background: `${cfg.color}12`, color: cfg.color,
            border: `1px solid ${cfg.color}25`, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {CAT_LABELS[cfg.category] || cfg.category}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {relTime(notif.ts)}
          </span>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '2px 4px', borderRadius: 6,
          opacity: 0, transition: 'opacity 0.15s', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--crimson)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
        title="Supprimer"
      >
        <Ic name="trash" size={13}/>
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION PANEL — style Apple/Android notification centre
// ═════════════════════════════════════════════════════════════════════════════
export function NotifPanel({ onClose }) {
  const { notifs, unreadCount, markRead, markAllRead, deleteNotif, clearAll } = useNotif();
  const [activeFilter, setActiveFilter] = useState('all');
  const panelRef = useRef(null);

  // Categories present
  const categories = ['all', ...new Set(
    notifs.map(n => (NOTIF_CONFIG[n.type] || {}).category).filter(Boolean)
  )];

  const filtered = notifs.filter(n => {
    if (activeFilter === 'all')    return true;
    if (activeFilter === 'unread') return !n.read;
    return (NOTIF_CONFIG[n.type] || {}).category === activeFilter;
  });

  // Grouper par jour
  const grouped = filtered.reduce((acc, n) => {
    const d = new Date(n.ts);
    const today    = new Date(); today.setHours(0,0,0,0);
    const yesterday= new Date(today); yesterday.setDate(today.getDate()-1);
    const key = d >= today ? "Aujourd'hui"
      : d >= yesterday ? 'Hier'
      : d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: 66, right: 16,
        width: 400, maxHeight: 'calc(100vh - 90px)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-soft)',
        borderRadius: 18,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
        zIndex: 1200,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'dropDown 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid var(--border-soft)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Notifications
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8, background:'var(--brand-dim)', border:'1px solid var(--border-medium)', color:'var(--brand)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              <Ic name="checkall" size={12} color="var(--brand)"/> Tout lire
            </button>
          )}
          {notifs.length > 0 && (
            <button onClick={clearAll}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:8, background:'var(--crimson-dim)', border:'1px solid rgba(220,38,38,0.2)', color:'var(--crimson)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font-body)' }}>
              <Ic name="trash" size={12} color="var(--crimson)"/> Effacer
            </button>
          )}
          <button onClick={onClose}
            style={{ background:'var(--bg-hover)', border:'1px solid var(--border-soft)', borderRadius:8, padding:6, cursor:'pointer', display:'flex' }}>
            <Ic name="x" size={15} color="var(--text-muted)"/>
          </button>
        </div>

        {/* Filtres */}
        <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:2 }}>
          {[['all','Tout'],['unread','Non lues']].concat(
            categories.filter(c=>c!=='all').map(c=>[c, CAT_LABELS[c]||c])
          ).map(([v,l]) => (
            <button key={v} onClick={()=>setActiveFilter(v)}
              style={{
                padding:'4px 11px', borderRadius:99, border:'none', cursor:'pointer',
                background: activeFilter===v ? 'var(--brand)' : 'var(--bg-raised)',
                color: activeFilter===v ? '#fff' : 'var(--text-muted)',
                fontSize:'0.73rem', fontWeight: activeFilter===v ? 700 : 500,
                whiteSpace:'nowrap', fontFamily:'var(--font-body)',
                transition:'all 0.15s',
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Liste ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth:'none' }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', gap:12 }}>
            <div style={{ width:56, height:56, borderRadius:18, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ic name="bell" size={24} color="var(--text-muted)"/>
            </div>
            <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-secondary)' }}>
              {activeFilter === 'unread' ? 'Tout est lu' : 'Aucune notification'}
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', textAlign:'center', lineHeight:1.5 }}>
              {activeFilter === 'unread'
                ? 'Vous avez lu toutes vos notifications'
                : 'Les alertes et mises à jour apparaîtront ici'}
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <div style={{
                padding:'8px 16px 4px',
                fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'0.08em', color:'var(--text-muted)',
                position:'sticky', top:0, background:'var(--bg-surface)',
                zIndex:1, borderBottom:'1px solid var(--border-dim)',
              }}>
                {day}
              </div>
              {items.map(n => (
                <NotifItem key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif}/>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{
        padding:'10px 16px', borderTop:'1px solid var(--border-dim)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0,
      }}>
        <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
          {notifs.length} notification{notifs.length!==1?'s':''}
        </span>
        <button
          onClick={async () => {
            if('Notification' in window) {
              if (Notification.permission === 'granted') {
                alert('Les alertes sont déjà activées');
              } else if (Notification.permission === 'denied') {
                alert('Les alertes ont été refusées. Vérifiez les paramètres de votre navigateur.');
              } else {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                  alert('Alertes activées avec succès!');
                } else {
                  alert('Vous avez refusé les alertes.');
                }
              }
            } else {
              alert('Les notifications ne sont pas supportées par votre navigateur.');
            }
          }}
          style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'0.72rem', padding:'4px 8px', borderRadius:6 }}>
          <Ic name="bell" size={12}/> Activer les alertes
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  BELL BUTTON — avec badge et panel dropdown
// ═════════════════════════════════════════════════════════════════════════════
export function NotifBell() {
  const { unreadCount, panelOpen, setPanelOpen, notifs } = useNotif();
  const btnRef  = useRef(null);
  const panelRef= useRef(null);

  // Fermer en cliquant ailleurs
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setPanelOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen, setPanelOpen]);

  // Priorité maximale parmi les non-lues (pour la couleur du badge)
  const maxPriority = notifs.filter(n=>!n.read).reduce((m,n) => Math.max(m, (NOTIF_CONFIG[n.type]||{}).priority||1), 0);
  const badgeColor = maxPriority === 3 ? 'var(--crimson)' : maxPriority === 2 ? 'var(--amber)' : 'var(--cobalt)';

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setPanelOpen(o => !o)}
        title="Notifications"
        style={{
          position: 'relative',
          width: 38, height: 38,
          borderRadius: 10,
          background: panelOpen ? 'var(--brand-dim)' : 'var(--bg-raised)',
          border: `1px solid ${panelOpen ? 'var(--border-active)' : 'var(--border-soft)'}`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          color: panelOpen ? 'var(--brand)' : 'var(--text-secondary)',
        }}
        onMouseEnter={e => { if(!panelOpen) { e.currentTarget.style.borderColor='var(--border-medium)'; e.currentTarget.style.background='var(--bg-hover)'; }}}
        onMouseLeave={e => { if(!panelOpen) { e.currentTarget.style.borderColor='var(--border-soft)'; e.currentTarget.style.background='var(--bg-raised)'; }}}
      >
        {/* Bell icon with pulse if urgent */}
        <span style={{ animation: maxPriority === 3 && unreadCount > 0 ? 'bellRing 1.2s ease infinite' : 'none', display:'flex' }}>
          <Ic name="bell" size={17} color={panelOpen ? 'var(--brand)' : unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)'}/>
        </span>

        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 17, height: 17, borderRadius: 99,
            background: badgeColor, color: '#fff',
            fontSize: '0.58rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid var(--bg-raised)',
            animation: maxPriority === 3 ? 'badgePulse 1.5s ease infinite' : 'none',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {panelOpen && (
        <div ref={panelRef}>
          <NotifPanel onClose={() => setPanelOpen(false)}/>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  CSS ANIMATIONS (injecté en <style> dans App.js)
// ═════════════════════════════════════════════════════════════════════════════
export const NOTIF_CSS = `
@keyframes slideInFromRight {
  from { opacity:0; transform:translateX(100%) scale(0.95); }
  to   { opacity:1; transform:translateX(0)    scale(1);    }
}
@keyframes dropDown {
  from { opacity:0; transform:translateY(-8px) scale(0.97); }
  to   { opacity:1; transform:translateY(0)    scale(1);    }
}
@keyframes bellRing {
  0%,100%{ transform:rotate(0);     }
  15%    { transform:rotate(12deg);  }
  30%    { transform:rotate(-10deg); }
  45%    { transform:rotate(8deg);   }
  60%    { transform:rotate(-6deg);  }
  75%    { transform:rotate(4deg);   }
}
@keyframes badgePulse {
  0%,100%{ box-shadow:0 0 0 0 rgba(220,38,38,0.4); }
  50%    { box-shadow:0 0 0 5px rgba(220,38,38,0);  }
}
`;
