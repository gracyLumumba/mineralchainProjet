import { Ic } from './Icons';
import React, { useEffect, useState } from 'react';
import { STATUS_CONFIG, MINERAL_CONFIG, fmt } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';

//  StatusBadge 
export function StatusBadge({ status }) {
  const { t } = useI18n();
  const c = STATUS_CONFIG[status] || { icon: 'tip', cls: 'badge-verifie' };
  const labelKey = {
    'AUTHENTIQUE':  'status.AUTHENTIQUE',
    'SUSPECT':      'status.SUSPECT',
    'À VÉRIFIER':   'status.À VÉRIFIER',
  }[status] || 'status.SUSPECT';
  return (
    <span className={`badge ${c.cls}`}>
      <Ic name={c.icon} size={12}/> {t(labelKey)}
    </span>
  );
}

//  MineralBadge 
export function MineralBadge({ type }) {
  const { t } = useI18n();
  const c = MINERAL_CONFIG[type] || { icon: 'gem', cls: 'badge-mixed' };
  const labelKey = {
    copper: 'mineral.copper',
    cobalt: 'mineral.cobalt',
    mixed:  'mineral.mixed',
  }[type] || 'mineral.mixed';
  return (
    <span className={`badge ${c.cls}`}>
      <Ic name={c.icon} size={12}/> {t(labelKey)}
    </span>
  );
}

//  ConfidenceGauge (SVG animated arc) 
export function ConfidenceGauge({ value, size = 120 }) {
  const { t } = useI18n();
  const pct = value > 1 ? value / 100 : value;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const R = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -210;
  const endAngle   = 30;
  const totalAngle = endAngle - startAngle;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (start, end) => {
    const s = { x: cx + R * Math.cos(toRad(start)), y: cy + R * Math.sin(toRad(start)) };
    const e = { x: cx + R * Math.cos(toRad(end)),   y: cy + R * Math.sin(toRad(end))   };
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const endArcAngle = startAngle + totalAngle * animated;
  const color = pct >= 0.85 ? 'var(--brand)' : pct >= 0.65 ? 'var(--amber)' : 'var(--crimson)';
  const display = Math.round(pct * 100);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Track */}
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke="var(--border-soft)" strokeWidth={size * 0.07} strokeLinecap="round"/>
        {/* Arc */}
        <path
          d={arcPath(startAngle, endArcAngle)}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          style={{ transition: 'all 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 ${size * 0.04}px ${color})` }}
        />
        {/* Needle dot */}
        <circle
          cx={cx + R * Math.cos(toRad(endArcAngle))}
          cy={cy + R * Math.sin(toRad(endArcAngle))}
          r={size * 0.05}
          fill={color}
          style={{ transition: 'all 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      {/* Center label */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: size * 0.05 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.24, color, lineHeight: 1, transition: 'color 0.5s' }}>
          {display}%
        </span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t('label.confidence')}</span>
      </div>
    </div>
  );
}

//  ConfidenceBar 
export function ConfidenceBar({ value }) {
  const pct = value > 1 ? value : value * 100;
  const color = pct >= 85 ? 'var(--brand)' : pct >= 65 ? 'var(--amber)' : 'var(--crimson)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 90 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.8s ease' }}/>
      </div>
      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color, fontWeight: 600, minWidth: 38 }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

//  StatCard 
export function StatCard({ label, value, icon, color = 'var(--brand)', delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="card stat-card" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.4s, transform 0.4s', transitionDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: 'var(--brand-dim)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {typeof icon === 'string' && icon.length > 2 ? <Ic name={icon} size={18} color={color}/> : <span style={{ fontSize: 20, opacity: 0.85 }}>{icon}</span>}
        </div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}`, marginTop: 4, opacity: 0.9 }}/>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color, lineHeight: 1, marginBottom: 6 }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
    </div>
  );
}

//  Loader 
export function Loader({ size = 18, color = 'var(--brand)' }) {
  return (
    <div className="loader" style={{ width: size, height: size, borderTopColor: color }}/>
  );
}

//  PageHeader 
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', lineHeight: 1.1, marginBottom: subtitle ? 6 : 0 }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

//  EmptyState 
export function EmptyState({ icon = 'gem', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.35, color: 'var(--text-muted)' }}>{typeof icon === 'string' && /^[a-z_]+$/.test(icon) ? <Ic name={icon} size={48} color="var(--text-muted)"/> : icon}</div>
      {title    && <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600 }}>{title}</div>}
      {subtitle && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 340 }}>{subtitle}</div>}
      {action   && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

//  InfoRow 
export function InfoRow({ label, value, highlight, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-dim)' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{
        fontSize: mono ? '0.75rem' : '0.875rem',
        fontWeight: highlight ? 600 : 400,
        color: highlight ? 'var(--brand)' : 'var(--text-secondary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        textAlign: 'right',
        wordBreak: 'break-all',
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

//  SectionTitle 
export function SectionTitle({ children, color = 'var(--brand)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
      <div style={{ height: 2, width: 28, background: color, opacity: 0.65, borderRadius: 999 }}/>
      <h3 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', color, textTransform: 'uppercase' }}>{children}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }}/>
    </div>
  );
}

//  Timeline 
export function Timeline({ events }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((ev, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
          {/* Vertical line */}
          {i < events.length - 1 && (
            <div style={{ position: 'absolute', left: 14, top: 28, bottom: -4, width: 1, background: ev.done ? 'var(--border-active)' : 'var(--border-dim)' }}/>
          )}
          {/* Dot */}
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: ev.done ? 'var(--brand-dim)' : 'var(--bg-raised)', border: `1px solid ${ev.done ? 'var(--border-active)' : 'var(--border-dim)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, zIndex: 1, color: ev.done ? 'var(--brand)' : 'var(--text-muted)' }}>
            {typeof ev.icon === 'string' && /^[a-z_]+$/.test(ev.icon) ? <Ic name={ev.icon} size={14}/> : ev.icon}
          </div>
          <div style={{ paddingBottom: 18 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: ev.done ? 600 : 400, color: ev.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {ev.label}
            </div>
            {ev.date && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{ev.date}</div>}
            {ev.detail && <div style={{ fontSize: '0.72rem', color: 'var(--brand)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{ev.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

//  ChemistryBar 
export function ChemistryBar({ label, value, max = 15, color = 'var(--copper-light)' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 90, fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 6px ${color}40` }}/>
      </div>
      <div style={{ width: 52, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color, fontWeight: 600, textAlign: 'right' }}>
        {Number(value).toFixed(2)}%
      </div>
    </div>
  );
}
