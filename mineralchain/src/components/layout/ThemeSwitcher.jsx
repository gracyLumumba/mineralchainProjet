import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Icon } from '../layout/Sidebar';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const opts = [
    { v: 'light', icon: 'sun',  label: 'Clair' },
    { v: 'dark',  icon: 'dark', label: 'Sombre' },
  ];
  const cur = opts.find(o => o.v === theme) || opts[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} title={cur.label} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 11px',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
        color: 'var(--text-secondary)',
        cursor: 'pointer', fontSize: '0.78rem',
        fontFamily: 'var(--font-body)', fontWeight: 500,
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
      >
        <Icon name={cur.icon} size={14} color="currentColor"/>
        <span>{cur.label}</span>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden', zIndex: 1000, minWidth: 130,
        }}>
          {opts.map(o => (
            <button key={o.v} onClick={() => { setTheme(o.v); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 14px',
              background: theme === o.v ? 'var(--brand-dim)' : 'transparent',
              border: 'none', cursor: 'pointer',
              color: theme === o.v ? 'var(--brand)' : 'var(--text-secondary)',
              fontSize: '0.84rem', fontFamily: 'var(--font-body)',
              fontWeight: theme === o.v ? 600 : 400,
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => { if (theme !== o.v) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (theme !== o.v) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={o.icon} size={15} color="currentColor"/>
              <span>{o.label}</span>
              {theme === o.v && (
                <svg style={{ marginLeft: 'auto' }} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeSwitcherInline() {
  return <ThemeSwitcher />;
}
