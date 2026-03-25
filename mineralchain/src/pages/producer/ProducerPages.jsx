import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { StatCard, PageHeader, EmptyState, StatusBadge, MineralBadge, ConfidenceBar } from '../../components/common/UI';
import { CertificateCard, MiniCertCard } from '../../components/common/Certificate';
import { fmt } from '../../contexts/AppContext';

import { Ic } from '../../components/common/Icons';

//  PRODUCER DASHBOARD 
export function ProducerDashboard() {
  const { lots, stats } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const recentLots = lots.slice(0, 6);
  const pendingValidationCount = lots.filter(l => l.analyzed_at && !l.regulator_validated && l.status !== 'SUSPECT').length;
  const PIE_COLORS = ['var(--brand)', 'var(--brand-light)', 'var(--emerald)'];
  const pieData = [
    { name: t('mineral.copper'), value: stats.copper_count || 0 },
    { name: t('mineral.cobalt'), value: stats.cobalt_count || 0 },
    { name: t('mineral.mixed'),  value: stats.mixed_count  || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t('producer.dashboard.title')}
        subtitle={t('producer.dashboard.subtitle')}
        actions={<Link to="/producer/new-lot"><button className="btn btn-gold">{t('action.new_lot')}</button></Link>}
      />
      {/* Alerte lots en attente de validation */}
      {(() => {
        const pending = lots.filter(l => l.analyzed_at && !l.regulator_validated && l.status !== 'SUSPECT');
        if (pending.length === 0) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', marginBottom: 20, background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--r-md)' }}>
            <span style={{ fontSize: 18 }}><Ic name="clock" size={14}/></span>
            <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--amber)', fontWeight: 500 }}>
              {t('reg.pending_alert', { n: pending.length, s: pending.length > 1 ? 's' : '' })}
            </div>
          </div>
        );
      })()}
      <div
        className="producer-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 28,
          alignItems: 'stretch',
        }}
      >
        <StatCard label={t('stat.total_lots')} value={stats.total_lots} icon="dashboard" color="var(--brand)" delay={0}/>
        <StatCard label={t('stat.certified')} value={stats.certified_count} icon="gem" color="var(--emerald)" delay={100}/>
        <StatCard label={t('stat.auth_rate')} value={`${stats.auth_rate}%`} icon="check" color="var(--emerald)" delay={200}/>
        <StatCard label={t('stat.suspects')} value={stats.suspect_count} icon="alert" color="var(--crimson)" delay={300}/>
        <StatCard label={t('admin.lots.awaiting')} value={pendingValidationCount} icon="clock" color="var(--amber)" delay={400}/>
      </div>

      <div className="grid-2 producer-dashboard-sections" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 16 }}>{t('producer.distribution.title')}</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none"/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: 8, fontSize: '0.8rem' }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }}/>
                    <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="gem" title={t('empty.no_data')} subtitle={t('empty.submit_first')}/>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 20 }}>{t('producer.quickactions.title')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <Ic name="plus" size={16} color="currentColor"/>, labelKey: 'nav.new_lot', descKey: 'producer.quickactions.new_desc', path: '/producer/new-lot', btn: 'btn-gold', descVal: null },
              { icon: <Ic name="list" size={16} color="currentColor"/>, labelKey: 'nav.my_lots', descKey: 'producer.quickactions.lots_desc', path: '/producer/my-lots', btn: 'btn-outline', descVal: stats.total_lots },
              { icon: <Ic name="certificate" size={16} color="currentColor"/>, labelKey: 'nav.certificates', descKey: 'producer.quickactions.certs_desc', path: '/producer/certificates', btn: 'btn-outline', descVal: stats.certified_count },
              { icon: <Ic name="verify" size={16} color="currentColor"/>, labelKey: 'nav.verify', descKey: 'producer.quickactions.verify_desc', path: '/verify', btn: 'btn-ghost', descVal: null },
            ].map(item => (
              <button key={item.path} className={`btn ${item.btn}`}
                style={{ justifyContent: 'flex-start', gap: 14, padding: '12px 16px' }}
                onClick={() => navigate(item.path)}
              >
                <span style={{ width: 24, display: 'flex', justifyContent: 'center' }}>{item.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t(item.labelKey)}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7, fontWeight: 400 }}>
                    {item.descVal != null ? `${item.descVal} ${t(item.descKey)}` : t(item.descKey)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {recentLots.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{t('producer.recent.title')}</h3>
            <Link to="/producer/my-lots" style={{ fontSize: '0.8rem' }}>{t('action.see_all')}</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('label.lot_id')}</th><th>{t('label.site')}</th><th>{t('label.type')}</th>
                  <th>{t('label.status')}</th><th>{t('label.confidence')}</th>
                  <th>{t('label.date')}</th><th>{t('label.token')}</th>
                </tr>
              </thead>
              <tbody>
                {recentLots.map(lot => (
                  <tr key={lot.lot_id}>
                    <td><Link to={`/producer/lot/${lot.lot_id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{lot.lot_id}</Link></td>
                    <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lot.site}</span></td>
                    <td><MineralBadge type={lot.mineral_type}/></td>
                    <td><StatusBadge status={lot.status}/></td>
                    <td><ConfidenceBar value={lot.confidence || 0}/></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{fmt.date(lot.analyzed_at)}</td>
                    <td>{lot.token_id != null ? <span style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>#{lot.token_id}</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState icon="mine" title={t('mylots.empty.title')} subtitle={t('mylots.empty.subtitle')}
            action={<Link to="/producer/new-lot"><button className="btn btn-gold">{t('action.first_lot')}</button></Link>}/>
        </div>
      )}
    </div>
  );
}

//  MY LOTS 
export function MyLotsPage() {
  const { lots } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [fType, setFType] = useState('all');
  const [page, setPage] = useState(1);
  const PER = 15;

  const filtered = lots.filter(l => {
    if (search && !l.lot_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (fStatus !== 'all' && l.status !== fStatus) return false;
    if (fType !== 'all' && l.mineral_type !== fType) return false;
    return true;
  });
  const pages = Math.ceil(filtered.length / PER);
  const paged = filtered.slice((page - 1) * PER, page * PER);

  const exportCSV = () => {
    const h = [t('label.lot_id'),t('label.site'),t('label.type'),t('label.status'),t('label.confidence'),t('label.date'),t('label.token')].join(',');
    const rows = filtered.map(l => [l.lot_id,l.site,l.mineral_type,l.status,`${((l.confidence||0)*100).toFixed(1)}%`,fmt.date(l.analyzed_at),l.token_id ?? ''].join(','));
    const blob = new Blob([[h,...rows].join('\n')], { type: 'text/csv' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'mes-lots.csv' }).click();
  };

  const SI = ({ value, onChange, options, placeholder }) => (
    <select value={value} onChange={e => { onChange(e.target.value); setPage(1); }} className="form-input" style={{ width: 'auto', minWidth: 130 }}>
      <option value="all">{placeholder}</option>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  const n = filtered.length;
  const s = n !== 1 ? 's' : '';

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t('mylots.title')}
        subtitle={t('mylots.subtitle', { n, s })}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportCSV}>{t('action.export_csv')}</button>
            <Link to="/producer/new-lot"><button className="btn btn-gold btn-sm">{t('action.new_lot')}</button></Link>
          </div>
        }
      />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder={t('mylots.filter.search')} value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ width: 220 }}/>
        <SI value={fStatus} onChange={setFStatus} placeholder={t('mylots.filter.all_status')} options={[
          { v:'AUTHENTIQUE',l:`${t('status.AUTHENTIQUE')}` },
          { v:'SUSPECT',l:`${t('status.SUSPECT')}` },
          { v:'À VÉRIFIER',l:`? ${t('status.À VÉRIFIER')}` },
        ]}/>
        <SI value={fType} onChange={setFType} placeholder={t('mylots.filter.all_types')} options={[
          { v:'copper',l:t('mineral.copper') },
          { v:'cobalt',l:t('mineral.cobalt') },
          { v:'mixed', l:t('mineral.mixed') },
        ]}/>
        {(search || fStatus !== 'all' || fType !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFStatus('all'); setFType('all'); setPage(1); }}>{t('action.clear')}</button>
        )}
      </div>

      {paged.length > 0 ? (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('label.lot_id')}</th><th>{t('label.site')}</th><th>{t('label.type')}</th>
                    <th>{t('label.status')}</th><th>{t('label.confidence')}</th>
                    <th>{t('label.impurities')}</th><th>{t('label.date')}</th>
                    <th>{t('label.token')}</th><th> Régulateur</th><th>{t('label.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(lot => (
                    <tr key={lot.lot_id}>
                      <td><Link to={`/producer/lot/${lot.lot_id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{lot.lot_id}</Link></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lot.site}</span></td>
                      <td><MineralBadge type={lot.mineral_type}/></td>
                      <td><StatusBadge status={lot.status}/></td>
                      <td><ConfidenceBar value={lot.confidence || 0}/></td>
                      <td><span style={{ fontSize: '0.78rem', color: lot.impurity_level === 'high' ? 'var(--crimson)' : lot.impurity_level === 'medium' ? 'var(--amber)' : 'var(--emerald)' }}>
                        {lot.impurity_level === 'low' ? t('impurity.low') : lot.impurity_level === 'medium' ? t('impurity.medium') : t('impurity.high')}
                      </span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{fmt.date(lot.analyzed_at)}</td>
                      <td>{lot.token_id != null
                        ? <span style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>#{lot.token_id}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{t('status.not_certified')}</span>}
                      </td>
                      <td>
                        {lot.status === 'SUSPECT'
                          ? <span style={{ color: 'var(--crimson)', fontSize: '0.72rem', fontWeight: 600 }}>Bloqué</span>
                          : lot.regulator_validated
                            ? <span style={{ color: 'var(--emerald)', fontSize: '0.72rem', fontWeight: 600 }}>Validé</span>
                            : <span style={{ color: 'var(--amber)', fontSize: '0.72rem' }}>En attente</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/producer/lot/${lot.lot_id}`)}>{t('action.view')}</button>
                          {!lot.transport_status && lot.token_id != null && (
                            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/producer/lot/${lot.lot_id}`)}><Ic name="truck" size={14}/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}><Ic name="arrow_left" size={14}/></button>
              {Array.from({length:pages},(_,i)=>i+1).map(p => (
                <button key={p} className={`btn btn-sm ${p===page?'btn-gold':'btn-ghost'}`} onClick={() => setPage(p)} style={{ minWidth: 36 }}>{p}</button>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages}><Ic name="arrow_right" size={14}/></button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon="dashboard"
            title={lots.length === 0 ? t('mylots.empty.title') : t('mylots.empty.no_results')}
            subtitle={lots.length === 0 ? t('mylots.empty.subtitle') : t('mylots.empty.modify_filters')}
            action={lots.length === 0 ? <Link to="/producer/new-lot"><button className="btn btn-gold">{t('action.first_lot')}</button></Link> : null}
          />
        </div>
      )}
    </div>
  );
}

//  CERTIFICATES GALLERY 
export function CertificatesPage() {
  const { lots, tokens } = useApp();
  const { t } = useI18n();
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const certifiedLots = lots.filter(l => l.token_id != null);
  const n = certifiedLots.length;
  const s = n !== 1 ? 's' : '';

  return (
    <div className="page-wrapper">
      <PageHeader title={t('certs.title')} subtitle={t('certs.subtitle', { n, s })}/>
      {certifiedLots.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {certifiedLots.map(lot => {
            const token = tokens.find(tk => tk.token_id === lot.token_id);
            return (
              <MiniCertCard key={lot.lot_id} lot={lot} token={token}
                onClick={() => { setSelectedLot(lot); setSelectedToken(token); }}/>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon="gem" title={t('certs.empty.title')} subtitle={t('certs.empty.subtitle')}
            action={<Link to="/producer/new-lot"><button className="btn btn-gold">{t('action.certify_lot')}</button></Link>}/>
        </div>
      )}
      {selectedLot && (
        <CertificateCard lot={selectedLot} token={selectedToken}
          onClose={() => { setSelectedLot(null); setSelectedToken(null); }}/>
      )}
    </div>
  );
}

