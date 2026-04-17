import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { StatCard, PageHeader, EmptyState, StatusBadge, MineralBadge, ConfidenceBar, SectionTitle } from '../../components/common/UI';
import { CertificateCard } from '../../components/common/Certificate';
import { fmt } from '../../contexts/AppContext';

import { Ic } from '../../components/common/Icons';

const TT = ({ active, payload, label }) => !active ? null : (
  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem' }}>
    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
    {payload?.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
  </div>
);

//  REGULATOR DASHBOARD 
export function RegulatorDashboard() {
  const { lots, stats } = useApp();
  const { t } = useI18n();
  const suspects      = lots.filter(l => l.status === 'SUSPECT');
  const pendingVal    = lots.filter(l => !l.regulator_validated && l.analyzed_at && l.status !== 'SUSPECT' && l.status !== 'AUTHENTIQUE').length;
  const recentActivity= lots.slice(0, 5);

  const barData = [
    { site: 'KAMOA', [t('regulator.bar.authentic')]: lots.filter(l => l.site==='KAMOA' && l.status==='AUTHENTIQUE').length, [t('regulator.bar.suspects')]: lots.filter(l => l.site==='KAMOA' && l.status==='SUSPECT').length },
    { site: 'KANSOKO', [t('regulator.bar.authentic')]: lots.filter(l => l.site==='KANSOKO' && l.status==='AUTHENTIQUE').length, [t('regulator.bar.suspects')]: lots.filter(l => l.site==='KANSOKO' && l.status==='SUSPECT').length },
  ];

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t('regulator.dashboard.title')}
        subtitle={t('regulator.dashboard.subtitle')}
        actions={<Link to="/regulator/lots"><button className="btn btn-outline">{t('action.see_all')}</button></Link>}
      />

      {/* Alerte lots en attente de validation */}
      {pendingVal > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', marginBottom:16, background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'var(--r-md)' }}>
          <span style={{ fontSize:18 }}><Ic name="clock" size={14}/></span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, color:'var(--amber)', fontSize:'0.88rem' }}>
              {t('reg.pending_alert', { n: pendingVal, s: pendingVal > 1 ? 's' : '' })}
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:2 }}>
              {t('reg.pending_blocked')}
            </div>
          </div>
          <Link to="/regulator/analysis" style={{ textDecoration:'none' }}>
            <button className="btn btn-outline btn-sm" style={{ color:'var(--amber)', borderColor:'rgba(245,158,11,0.4)' }}>
              <Ic name="arrow_right" size={14}/> Valider
            </button>
          </Link>
        </div>
      )}

      {/* Alerte lots SUSPECT */}
      {suspects.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', marginBottom:24, background:'var(--crimson-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--r-md)', animation:'fadeUp 0.3s ease' }}>
          <span style={{ fontSize:20 }}><Ic name="alert" size={14}/></span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, color:'var(--crimson)', fontSize:'0.9rem' }}>
              {t('regulator.alert.title', { n: suspects.length, s: suspects.length > 1 ? 's' : '' })}
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:2 }}>
              {suspects.map(s => s.lot_id).join(' · ')}
            </div>
          </div>
          <Link to="/regulator/alerts"><button className="btn btn-danger btn-sm">{t('nav.alerts')}</button></Link>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16, marginBottom:28 }}>
        <StatCard label={t('stat.total_lots')}   value={stats.total_lots}      icon="dashboard"  color="var(--brand)"   delay={0}/>
        <StatCard label={t('stat.certified')}    value={stats.certified_count} icon="gem"  color="var(--emerald)" delay={100}/>
        <StatCard label={t('stat.auth_rate')}    value={`${stats.auth_rate}%`} icon="check"  color="var(--emerald)" delay={200}/>
        <StatCard label={t('stat.suspects')}     value={stats.suspect_count}   icon="block" color="var(--crimson)"  delay={300}/>
        <StatCard label="En attente validation"  value={pendingVal}             icon="clock" color="var(--amber)"    delay={400}/>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:16 }}>{t('regulator.lots.title')}</h3>
          {barData.some(d => d[t('regulator.bar.authentic')] > 0 || d[t('regulator.bar.suspects')] > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="site" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey={t('regulator.bar.authentic')} fill="var(--brand)" radius={[4,4,0,0]}/>
                <Bar dataKey={t('regulator.bar.suspects')}  fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <EmptyState icon="dashboard" title={t('empty.no_data')} subtitle={t('empty.after_first')}/>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:16 }}>{t('regulator.activity.title')}</h3>
          {recentActivity.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {recentActivity.map(lot => (
                <div key={lot.lot_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-raised)', borderRadius:'var(--r-md)', border:`1px solid ${lot.status==='SUSPECT'?'rgba(239,68,68,0.2)':'var(--border-dim)'}` }}>
                  <span className={`dot ${lot.status==='AUTHENTIQUE'?'dot-success':lot.status==='SUSPECT'?'dot-danger':'dot-warning'}`}/>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', flex:1 }}>{lot.lot_id}</span>
                  <MineralBadge type={lot.mineral_type}/>
                  {lot.regulator_validated
                    ? <span style={{ fontSize:'0.7rem', color:'var(--emerald)' }}>validated</span>
                    : <span style={{ fontSize:'0.7rem', color:'var(--amber)' }}><Ic name="clock" size={14}/></span>
                  }
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{fmt.date(lot.analyzed_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="clock" title={t('empty.no_activity')} subtitle={t('empty.after_first')}/>
          )}
        </div>
      </div>

      {lots.length > 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border-dim)', display:'flex', justifyContent:'space-between' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem' }}>{t('regulator.overview.title')}</h3>
            <Link to="/regulator/lots" style={{ fontSize:'0.8rem' }}>{t('action.see_all')}</Link>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead><tr>
                <th>{t('label.lot_id')}</th><th>{t('label.site')}</th><th>{t('label.type')}</th>
                <th>{t('label.status')}</th><th>{t('label.confidence')}</th>
                <th>Validation</th><th>{t('label.date')}</th><th>NFT</th>
              </tr></thead>
              <tbody>
                {lots.slice(0, 8).map(lot => (
                  <tr key={lot.lot_id} style={{ background: lot.status==='SUSPECT'?'rgba(239,68,68,0.04)':undefined }}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem' }}>{lot.lot_id}</span></td>
                    <td><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{lot.site}</span></td>
                    <td><MineralBadge type={lot.mineral_type}/></td>
                    <td><StatusBadge status={lot.status}/></td>
                    <td><ConfidenceBar value={lot.confidence||0}/></td>
                    <td>
                      {lot.status==='SUSPECT'
                        ? <span style={{ color:'var(--crimson)', fontSize:'0.72rem', fontWeight:600 }}>Bloqué</span>
                        : lot.regulator_validated
                          ? <span style={{ color:'var(--emerald)', fontSize:'0.72rem', fontWeight:600 }}>ok Validé</span>
                          : <span style={{ color:'var(--amber)', fontSize:'0.72rem' }}> En attente</span>
                      }
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{fmt.date(lot.analyzed_at)}</td>
                    <td>{lot.token_id ? <span style={{ color:'var(--brand)', fontFamily:'var(--font-mono)', fontSize:'0.8rem' }}>#{lot.token_id}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

//  REGULATOR ALL LOTS 
export function RegulatorLotsPage() {
  const { lots } = useApp();
  const { t } = useI18n();
  const [search, setSearch]   = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [fSite, setFSite]     = useState('all');
  const [fType, setFType]     = useState('all');
  const [fValid, setFValid]   = useState('all');
  const [page, setPage]       = useState(1);
  const PER = 20;

  const filtered = lots.filter(l => {
    if (search  && !l.lot_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (fStatus !== 'all' && l.status  !== fStatus)       return false;
    if (fSite   !== 'all' && l.site    !== fSite)         return false;
    if (fType   !== 'all' && l.mineral_type !== fType)    return false;
    if (fValid === 'validated'   && !l.regulator_validated)           return false;
    if (fValid === 'pending'     && (l.regulator_validated || l.status==='SUSPECT')) return false;
    if (fValid === 'suspect'     && l.status !== 'SUSPECT')           return false;
    return true;
  });
  const pages  = Math.ceil(filtered.length / PER);
  const paged  = filtered.slice((page-1)*PER, page*PER);

  const exportCSV = () => {
    const h = [t('label.lot_id'),t('label.site'),t('label.type'),t('label.status'),'Validation','Cu%','Co%','Fe%',t('label.date'),'NFT'].join(',');
    const rows = filtered.map(l => [l.lot_id,l.site,l.mineral_type,l.status,l.regulator_validated?'Validé':'En attente',l.cu_grade_percent||'',l.co_grade_percent||'',l.fe_percent||'',fmt.date(l.analyzed_at),l.token_id||''].join(','));
    const blob = new Blob([[h,...rows].join('\n')], { type:'text/csv' });
    Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:'supervision-lots.csv' }).click();
  };

  const SI = ({ value, onChange, options, placeholder }) => (
    <select value={value} onChange={e=>{ onChange(e.target.value); setPage(1); }} className="form-input" style={{ width:'auto', minWidth:130 }}>
      <option value="all">{placeholder}</option>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  const n = filtered.length; const s = n!==1?'s':'';
  return (
    <div className="page-wrapper">
      <PageHeader title={t('reglots.title')} subtitle={t('reglots.subtitle',{n,s})}
        actions={<button className="btn btn-ghost btn-sm" onClick={exportCSV}>{t('action.export_csv')}</button>}/>

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-input" placeholder={t('mylots.filter.search')} value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(1); }} style={{ width:200 }}/>
        <SI value={fSite}   onChange={setFSite}   placeholder={t('reglots.filter.all_sites')} options={[{v:'KAMOA',l:'KAMOA'},{v:'KANSOKO',l:'KAMOA-KANSOKO'}]}/>
        <SI value={fStatus} onChange={setFStatus} placeholder={t('mylots.filter.all_status')} options={[
          {v:'AUTHENTIQUE',l:`ok ${t('status.AUTHENTIQUE')}`},{v:'SUSPECT',l:`! ${t('status.SUSPECT')}`},{v:'À VÉRIFIER',l:`? ${t('status.À VÉRIFIER')}`}
        ]}/>
        <SI value={fType}   onChange={setFType}   placeholder={t('mylots.filter.all_types')} options={[
          {v:'copper',l:t('mineral.copper')},{v:'cobalt',l:t('mineral.cobalt')},{v:'mixed',l:t('mineral.mixed')}
        ]}/>
        <SI value={fValid}  onChange={setFValid}  placeholder={t('admin.filter.all')} options={[
          {v:'validated',l:t('admin.dgmr.validated')},{v:'pending',l:t('trans.awaiting_dgmr')},{v:'suspect',l:t('status.SUSPECT')}
        ]}/>
        {(search||fStatus!=='all'||fSite!=='all'||fType!=='all'||fValid!=='all') && (
          <button className="btn btn-ghost btn-sm" onClick={()=>{ setSearch('');setFStatus('all');setFSite('all');setFType('all');setFValid('all');setPage(1); }}>{t('action.clear')}</button>
        )}
      </div>

      {paged.length > 0 ? (
        <>
          <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr>
                  <th>{t('label.lot_id')}</th><th>{t('label.site')}</th><th>{t('label.type')}</th>
                  <th>{t('label.status')}</th><th>{t('label.confidence')}</th>
                  <th>Cu%</th><th>Co%</th><th>Fe%</th>
                  <th>Validation</th><th>{t('label.date')}</th><th>NFT</th>
                </tr></thead>
                <tbody>
                  {paged.map(lot => (
                    <tr key={lot.lot_id} style={{ background:lot.status==='SUSPECT'?'rgba(239,68,68,0.04)':undefined }}>
                      <td><span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem' }}>{lot.lot_id}</span></td>
                      <td><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{lot.site}</span></td>
                      <td><MineralBadge type={lot.mineral_type}/></td>
                      <td><StatusBadge status={lot.status}/></td>
                      <td><ConfidenceBar value={lot.confidence||0}/></td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--copper-light)' }}>{lot.cu_grade_percent!=null?Number(lot.cu_grade_percent).toFixed(2):'—'}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--brand-light)' }}>{lot.co_grade_percent!=null?Number(lot.co_grade_percent).toFixed(2):'—'}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--text-muted)' }}>{lot.fe_percent!=null?Number(lot.fe_percent).toFixed(2):'—'}</td>
                      <td>
                        {lot.status==='SUSPECT'
                          ? <span style={{ color:'var(--crimson)', fontSize:'0.72rem', fontWeight:600 }}>Bloqué</span>
                          : lot.regulator_validated
                            ? <span style={{ color:'var(--emerald)', fontSize:'0.72rem', fontWeight:600 }}>{fmt.date(lot.regulator_validated_at)}</span>
                            : <span style={{ color:'var(--amber)', fontSize:'0.72rem' }}> En attente</span>
                        }
                      </td>
                      <td style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{fmt.date(lot.analyzed_at)}</td>
                      <td>{lot.token_id?<span style={{ color:'var(--brand)', fontFamily:'var(--font-mono)', fontSize:'0.8rem' }}>#{lot.token_id}</span>:'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {pages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}><Ic name="arrow_left" size={14}/></button>
              {Array.from({length:pages},(_,i)=>i+1).filter(p=>Math.abs(p-page)<3).map(p=>(
                <button key={p} className={`btn btn-sm ${p===page?'btn-gold':'btn-ghost'}`} onClick={()=>setPage(p)} style={{ minWidth:36 }}>{p}</button>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}><Ic name="arrow_right" size={14}/></button>
            </div>
          )}
        </>
      ) : (
        <div className="card"><EmptyState icon="dashboard" title={lots.length===0?t('empty.no_lots'):t('empty.no_data')} subtitle={t('empty.modify_filters')}/></div>
      )}
    </div>
  );
}

//  FRAUD ALERTS 
export function AlertsPage() {
  const { lots, stats } = useApp();
  const { t } = useI18n();
  const pendingVal = stats ? (stats.pending_validation || 0) : 0;
  const suspects   = lots.filter(l => l.status === 'SUSPECT');
  const toVerify   = lots.filter(l => l.status === 'À VÉRIFIER');

  const AlertCard = ({ lot }) => (
    <div style={{
      padding:'18px 20px',
      background: lot.status==='SUSPECT' ? 'var(--crimson-dim)' : 'var(--amber-dim)',
      border:`1px solid ${lot.status==='SUSPECT'?'rgba(239,68,68,0.25)':'rgba(245,158,11,0.25)'}`,
      borderRadius:'var(--r-md)', display:'flex', alignItems:'flex-start', gap:16,
    }}>
      <span style={{ fontSize:24, flexShrink:0 }}>{lot.status==='SUSPECT'?'S':'W'}</span>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'0.9rem' }}>{lot.lot_id}</span>
          <StatusBadge status={lot.status}/><MineralBadge type={lot.mineral_type}/>
        </div>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
          <span>{t('label.site')}: <strong>{lot.site}</strong></span>
          <span>{t('label.confidence')}: <strong>{lot.confidence?`${(lot.confidence*100).toFixed(1)}%`:'—'}</strong></span>
          <span>Cu: <strong>{lot.cu_grade_percent!=null?`${lot.cu_grade_percent}%`:'—'}</strong></span>
          <span>Co: <strong>{lot.co_grade_percent!=null?`${lot.co_grade_percent}%`:'—'}</strong></span>
          <span>{t('label.date')}: <strong>{fmt.date(lot.analyzed_at)}</strong></span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <PageHeader title={t('alerts.title')} subtitle={t('alerts.subtitle')}/>

      {/* Alerte lots en attente de validation */}
      {pendingVal > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', marginBottom:20, background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'var(--r-md)' }}>
          <span style={{ fontSize:18 }}><Ic name="clock" size={14}/></span>
          <div style={{ flex:1, fontSize:'0.85rem', color:'var(--amber)', fontWeight:500 }}>
            {t('reg.pending_alert', { n: pendingVal, s: pendingVal>1?'s':'' })} — transport bloqué
          </div>
          <Link to="/regulator/analysis" style={{ textDecoration:'none' }}>
            <button className="btn btn-outline btn-sm" style={{ color:'var(--amber)', borderColor:'rgba(245,158,11,0.4)' }}>{t('reg.validate_now')}</button>
          </Link>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
        <div style={{ padding:'16px 20px', background:'var(--crimson-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r-md)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Ic name="block" size={22} color="var(--crimson)"/>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:700, color:'var(--crimson)' }}>{suspects.length}</div>
              <div className="label">{t('alerts.suspects')}</div>
            </div>
          </div>
        </div>
        <div style={{ padding:'16px 20px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'var(--r-md)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Ic name="alert" size={22} color="var(--amber)"/>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:700, color:'var(--amber)' }}>{toVerify.length}</div>
              <div className="label">{t('alerts.to_verify')}</div>
            </div>
          </div>
        </div>
      </div>

      {suspects.length > 0 && (
        <><SectionTitle>{t('alerts.section.suspects')}</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
          {suspects.map(lot => <AlertCard key={lot.lot_id} lot={lot}/>)}
        </div></>
      )}
      {toVerify.length > 0 && (
        <><SectionTitle>{t('alerts.section.to_verify')}</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {toVerify.map(lot => <AlertCard key={lot.lot_id} lot={lot}/>)}
        </div></>
      )}
      {suspects.length===0 && toVerify.length===0 && (
        <div className="card"><EmptyState icon="check" title={t('alerts.empty.title')} subtitle={t('alerts.empty.subtitle')}/></div>
      )}
    </div>
  );
}

//  VERIFY CERTIFICATE 
export function RegulatorVerifyPage() {
  const { lots, tokens } = useApp();
  const { t } = useI18n();
  const [query, setQuery]   = useState('');
  const [result, setResult] = useState(null);
  const [showCert, setShowCert] = useState(false);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound]   = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResult(null); setNotFound(false);
    await new Promise(r => setTimeout(r, 800));
    const lot   = lots.find(l => l.lot_id.toLowerCase()===query.trim().toLowerCase() || String(l.token_id)===query.trim());
    const token = lot ? tokens.find(tk => tk.token_id===lot.token_id) : null;
    if (lot) setResult({ lot, token }); else setNotFound(true);
    setSearching(false);
  };

  return (
    <div className="page-wrapper">
      <PageHeader title={t('verify.title')} subtitle={t('verify.subtitle')}/>
      <div className="card" style={{ maxWidth:640, marginBottom:24 }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:16 }}>{t('verify.search.title')}</h3>
        <div style={{ display:'flex', gap:12 }}>
          <input className="form-input" placeholder={t('verify.search.placeholder')} value={query}
            onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} style={{ flex:1 }}/>
          <button className="btn btn-gold" onClick={handleSearch} disabled={!query.trim()||searching} style={{ flexShrink:0 }}>
            {searching ? <div className="loader" style={{ borderTopColor:'#0c0a06' }}/> : t('action.search')}
          </button>
        </div>
        <div style={{ marginTop:10, fontSize:'0.78rem', color:'var(--text-muted)' }}>{t('verify.tip')}</div>
      </div>

      {result && (
        <div className="card" style={{ maxWidth:640, border:`1px solid ${result.lot.status==='SUSPECT'?'rgba(239,68,68,0.3)':'var(--border-active)'}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <span style={{ fontSize:24 }}>{result.lot.status==='AUTHENTIQUE' ? 'ok' : result.lot.status==='SUSPECT' ? 'fail' : 'warn'}</span>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem' }}>{result.lot.lot_id}</h3>
            <StatusBadge status={result.lot.status}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px', marginBottom:16 }}>
            {[
              [t('label.type'), <MineralBadge type={result.lot.mineral_type}/>],
              [t('label.site'), result.lot.site],
              [t('label.confidence'), `${result.lot.confidence?(result.lot.confidence*100).toFixed(1):'—'}%`],
              ['Validation régulateur', result.lot.regulator_validated ? `ok ${fmt.date(result.lot.regulator_validated_at)}` : t('trans.awaiting_dgmr')],
              [t('label.analysis_date'), fmt.date(result.lot.analyzed_at)],
              ['NFT Token', result.lot.token_id?`#${result.lot.token_id}`:t('status.not_certified')],
              ['Transport', result.lot.transport_status==='delivered'?`Livré à ${result.lot.destination}`:result.lot.transport_status==='en_route'?`En route: ${result.lot.destination}`:t('status.not_certified')],
            ].map(([l,v]) => (
              <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid var(--border-dim)' }}>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:'0.875rem' }}>{v}</div>
              </div>
            ))}
          </div>
          {result.lot.token_id && <button className="btn btn-gold btn-sm" onClick={()=>setShowCert(true)}>{t('action.view_certificate')}</button>}
        </div>
      )}

      {notFound && (
        <div className="card" style={{ maxWidth:640, border:'1px solid rgba(239,68,68,0.2)', background:'var(--crimson-dim)' }}>
          <EmptyState icon="?" title={t('verify.not_found')} subtitle={t('verify.not_found.subtitle',{q:query})}/>
        </div>
      )}
      {showCert && result?.lot && <CertificateCard lot={result.lot} token={result.token} onClose={()=>setShowCert(false)}/>}
    </div>
  );
}
