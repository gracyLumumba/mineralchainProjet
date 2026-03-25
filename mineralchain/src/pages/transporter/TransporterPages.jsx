import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { StatCard, PageHeader, EmptyState, StatusBadge, MineralBadge, Timeline, ConfidenceBar } from '../../components/common/UI';
import { CertificateCard } from '../../components/common/Certificate';
import { fmt } from '../../contexts/AppContext';

import { Ic } from '../../components/common/Icons';

// Site badge component
function SiteBadge({ site }) {
  const cls = site === 'KAMOA' ? 'site-kamoa' : site === 'KCC' ? 'site-kcc' : 'site-kansoko';
  return <span className={`site-badge ${cls}`}>{site}</span>;
}

//  Règle métier : lot accessible au transport uniquement si validé régulateur
const isTransportReady = (l) =>
  l.status === 'AUTHENTIQUE' && l.regulator_validated === true;

//  LotTransportCard 
function LotTransportCard({ lot, tokens, updateLot, addToast }) {
  const { t } = useI18n();
  const token      = tokens.find(tk => tk.token_id === lot.token_id);
  const [showCert, setShowCert]       = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const [destination, setDestination] = useState(lot.destination || '');

  const handleStartTransport = async () => {
    if (!destination.trim()) { addToast('Entrez une destination', 'warning'); return; }
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1000));
    updateLot(lot.lot_id, {
      transport_status: 'en_route',
      destination,
      transferred_at: new Date().toISOString(),
    });
    addToast(`${lot.lot_id} vers ${destination}`, 'success');
    setConfirming(false);
  };

  const handleDeliver = async () => {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 800));
    updateLot(lot.lot_id, {
      transport_status: 'delivered',
      delivered_at: new Date().toISOString(),
    });
    addToast(`${lot.lot_id} — Livré à ${lot.destination}`, 'success');
    setConfirming(false);
  };

  return (
    <>
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${lot.transport_status==='en_route'?'var(--border-active)':lot.transport_status==='delivered'?'rgba(16,185,129,0.3)':'var(--border-soft)'}`,
        borderRadius: 'var(--r-lg)', padding: '18px 22px',
        display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'0.95rem', color:'var(--gold)' }}>{lot.lot_id}</span>
            <MineralBadge type={lot.mineral_type}/><StatusBadge status={lot.status}/>
            {lot.transport_status==='en_route'    && <span className="badge badge-transport">{t('status.in_transit')}</span>}
            {lot.transport_status==='delivered'   && <span className="badge badge-authentique">{t('status.delivered')}</span>}
          </div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
            <span>{t('label.site')}: <strong>{lot.site}</strong></span>
            <span>{t('label.weight')}: <strong>{lot.weight_tonnes?`${lot.weight_tonnes} t`:'—'}</strong></span>
            {lot.token_id != null && <span>NFT: <strong style={{ color:'var(--gold)' }}>#{lot.token_id}</strong></span>}
            {lot.destination && <span>{t('label.destination')}: <strong>{lot.destination}</strong></span>}
            {lot.transport_status==='delivered' && <span style={{ color:'var(--emerald)' }}>Livré le {fmt.date(lot.delivered_at)}</span>}
          </div>
          {/* Validation régulateur */}
          <div style={{ marginTop:8, fontSize:'0.72rem' }}>
            <span style={{ color:lot.regulator_validated?'var(--emerald)':'var(--amber)' }}>
              {lot.regulator_validated?`${t('trans.validated_dgmr')} — ${fmt.date(lot.regulator_validated_at)}`:t('trans.awaiting_dgmr')}
            </span>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
          {lot.token_id != null && <button className="btn btn-ghost btn-sm" onClick={()=>setShowCert(true)}><Ic name="certificate" size={14}/> Certificat</button>}

          {!isTransportReady(lot) && !lot.transport_status && (
            <div style={{ padding:'8px 12px', background:'var(--crimson-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r-md)', fontSize:'0.75rem', color:'var(--crimson)' }}>
              {lot.status==='SUSPECT'?t('trans.blocked_suspect'):t('trans.blocked_pending')}
            </div>
          )}

          {isTransportReady(lot) && !lot.transport_status && (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input className="form-input" placeholder={t('trans.destination.placeholder')} value={destination}
                onChange={e=>setDestination(e.target.value)} style={{ width:200, padding:'6px 10px', fontSize:'0.82rem' }}
                onKeyDown={e=>e.key==='Enter'&&handleStartTransport()}/>
              <button className="btn btn-gold btn-sm" onClick={handleStartTransport} disabled={confirming}>
                {confirming ? <div className="loader" style={{ width:14, height:14, borderTopColor:'#0c0a06' }}/> : t('action.start_transport')}
              </button>
            </div>
          )}

          {lot.transport_status==='en_route' && (
            <button className="btn btn-sm" style={{ background:'var(--emerald-dim)', border:'1px solid rgba(16,185,129,0.3)', color:'var(--emerald)' }}
              onClick={handleDeliver} disabled={confirming}>
              {confirming ? <div className="loader" style={{ width:14, height:14, borderTopColor:'var(--emerald)' }}/> : t('action.confirm_delivery')}
            </button>
          )}

          {lot.transport_status==='delivered' && (
            <span style={{ fontSize:'0.82rem', color:'var(--emerald)', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
              <span>&#10003;</span> <span>Livré</span>
            </span>
          )}
        </div>
      </div>
      {showCert && <CertificateCard lot={lot} token={token} onClose={()=>setShowCert(false)}/>}
    </>
  );
}

//  TRANSPORTER DASHBOARD 
export function TransporterDashboard() {
  const { lots, tokens, updateLot, addToast } = useApp();
  const { t } = useI18n();
  const assigned  = lots.filter(l => isTransportReady(l) && l.token_id != null && !l.transport_status);
  const inRoute   = lots.filter(l => l.transport_status === 'en_route');
  const delivered = lots.filter(l => l.transport_status === 'delivered');
  const blocked   = [];
  return (
    <div className="page-wrapper">
      <PageHeader title={t('trans.dashboard.title')} subtitle={t('trans.dashboard.subtitle')}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <StatCard label={t('stat.to_transport')} value={assigned.length}  icon="package" color="var(--amber)"        delay={0}/>
        <StatCard label={t('stat.in_transit')}   value={inRoute.length}   icon="truck" color="var(--brand-light)" delay={100}/>
        <StatCard label={t('stat.delivered')}    value={delivered.length} icon="check"  color="var(--emerald)"      delay={200}/>
        <StatCard label={t('stat.certified')}            value={assigned.length + inRoute.length + delivered.length}   icon="scale" color="var(--brand)"   delay={300}/>
      </div>

      {/* Lots en cours */}
      {inRoute.length > 0 && (
        <>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:14, color:'var(--brand)' }}>{t('trans.in_route')}</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            {inRoute.map(lot => <LotTransportCard key={lot.lot_id} lot={lot} tokens={tokens} updateLot={updateLot} addToast={addToast}/>)}
          </div>
        </>
      )}

      {/* Lots prêts à transporter */}
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:14 }}>{t('trans.pickup')}</h3>
      {assigned.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {assigned.map(lot => <LotTransportCard key={lot.lot_id} lot={lot} tokens={tokens} updateLot={updateLot} addToast={addToast}/>)}
        </div>
      ) : (
        <div className="card" style={{ marginBottom:24 }}>
          <EmptyState icon="package" title={t('trans.empty')} subtitle={t('trans.empty.subtitle')}/>
        </div>
      )}

      {/* Lots bloqués en attente régulateur */}
      {blocked.length > 0 && (
        <>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:10, color:'var(--amber)' }}><Ic name="clock" size={13}/> En attente validation DGMR</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {blocked.map(lot => (
              <div key={lot.lot_id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 18px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'var(--r-md)' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--amber)', fontSize:'0.88rem' }}>{lot.lot_id}</span>
                <MineralBadge type={lot.mineral_type}/>
                <StatusBadge status={lot.status}/>
                <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:'var(--text-muted)' }}>
                  Analyse IA: {fmt.date(lot.analyzed_at)} · En attente régulateur
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

//  ASSIGNED LOTS 
export function AssignedLotsPage() {
  const { lots, tokens, updateLot, addToast } = useApp();
  const { t } = useI18n();
  const [filter, setFilter] = useState('ready'); // ready | all | delivered
  const readyLots    = lots.filter(l => isTransportReady(l) && l.token_id != null && !l.transport_status);
  const inRouteLots  = lots.filter(l => l.transport_status === 'en_route');
  const allCertified = lots.filter(l => isTransportReady(l) && l.token_id != null);

  const displayLots = filter === 'ready'     ? readyLots
    : filter === 'delivered' ? lots.filter(l => l.transport_status==='delivered')
    : allCertified;

  const n = displayLots.length; const s = n!==1?'s':'';
  return (
    <div className="page-wrapper">
      <PageHeader title={t('assigned.title')} subtitle={t('assigned.subtitle',{n,s})}/>
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        {[['ready',t('trans.filter.ready')],['route',t('trans.filter.route')],['delivered',t('trans.filter.delivered')],['all',t('trans.filter.all')]].map(([v,l])=>(
          <button key={v} className={`btn btn-sm ${filter===v?'btn-outline':'btn-ghost'}`}
            onClick={()=>setFilter(v)}
            style={{ color: filter===v?'var(--brand)':undefined }}>
            {l} ({v==='ready'?readyLots.length:v==='route'?inRouteLots.length:v==='delivered'?lots.filter(l=>l.transport_status==='delivered').length:allCertified.length})
          </button>
        ))}
      </div>
      {displayLots.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {displayLots.map(lot => <LotTransportCard key={lot.lot_id} lot={lot} tokens={tokens} updateLot={updateLot} addToast={addToast}/>)}
        </div>
      ) : (
        <div className="card"><EmptyState icon="package" title={t('assigned.empty')} subtitle={t('trans.empty.subtitle')}/></div>
      )}
    </div>
  );
}

//  QR SCANNER 
export function QRScannerPage() {
  const { lots, tokens } = useApp();
  const { t } = useI18n();
  const [manualInput, setManualInput] = useState('');
  const [result, setResult]           = useState(null);
  const [showCert, setShowCert]       = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [notFound, setNotFound]       = useState(false);
  const [scanAnim, setScanAnim]       = useState(false);

  const parseAndSearch = (raw) => {
    let lotId = raw.trim();
    try { const url = new URL(raw.trim()); lotId = url.searchParams.get('lot') || lotId; } catch (error) { void error; }
    const lot   = lots.find(l => l.lot_id === lotId || String(l.token_id) === lotId);
    const token = lot ? tokens.find(tk => tk.token_id === lot.token_id) : null;
    return lot && isTransportReady(lot) ? { lot, token } : null;
  };

  const handleSearch = () => {
    if (!manualInput.trim()) return;
    setScanning(true); setNotFound(false); setResult(null);
    setTimeout(() => {
      const found = parseAndSearch(manualInput);
      if (found) setResult(found);
      else setNotFound(true);
      setScanning(false);
    }, 600);
  };

  const handleSimulateScan = () => {
    if (lots.length === 0) { return; }
    setScanAnim(true);
    setTimeout(() => {
      setScanAnim(false);
      const certified = lots.find(l => isTransportReady(l) && l.token_id != null);
      if (certified) {
        const token = tokens.find(tk => tk.token_id === certified.token_id);
        setResult({ lot: certified, token });
      } else setNotFound(true);
    }, 2000);
  };

  return (
    <div className="page-wrapper">
      <PageHeader title={t('scanner.title')} subtitle={t('scanner.subtitle')}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, maxWidth:900 }}>
        {/* Scanner zone */}
        <div className="card" style={{ textAlign:'center' }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:20 }}>{t('scanner.zone')}</h3>
          <div style={{ width:240, height:240, margin:'0 auto 20px', border:'2px solid var(--border-active)', borderRadius:'var(--r-lg)', position:'relative', overflow:'hidden', background:'var(--bg-raised)', cursor:'pointer' }}
            onClick={handleSimulateScan}>
            {[['0,0'],['auto,0'],['0,auto'],['auto,auto']].map(([pos],idx) => {
              const [top,left] = pos.split(',');
              return <div key={idx} style={{ position:'absolute', top:top==='0'?8:'auto', bottom:top==='auto'?8:'auto', left:left==='0'?8:'auto', right:left==='auto'?8:'auto', width:24, height:24, borderTop:top==='0'?'2px solid var(--brand)':'none', borderBottom:top==='auto'?'2px solid var(--brand)':'none', borderLeft:left==='0'?'2px solid var(--brand)':'none', borderRight:left==='auto'?'2px solid var(--brand)':'none' }}/>;
            })}
            {scanAnim && <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,var(--brand),transparent)', animation:'scanLine 1s linear infinite', boxShadow:'0 0 10px var(--brand)' }}/>}
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
              <Ic name="qr" size={48} color="var(--text-muted)"/>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{scanAnim?t('scanner.scanning'):t('scanner.click')}</div>
            </div>
          </div>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:16 }}>{t('scanner.camera_info')}</p>
          <button className="btn btn-gold btn-sm" onClick={handleSimulateScan} disabled={scanAnim}>
            {scanAnim ? <><div className="loader" style={{ width:14, height:14, borderTopColor:'#0c0a06' }}/> {t('scanner.scanning')}</> : t('action.simulate_scan')}
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:16 }}>{t('scanner.manual')}</h3>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">{t('label.lot_id')} / Token ID</label>
              <input className="form-input" placeholder={t('scanner.placeholder')} value={manualInput}
                onChange={e=>setManualInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}/>
            </div>
            <button className="btn btn-outline" style={{ width:'100%', justifyContent:'center' }} onClick={handleSearch} disabled={!manualInput.trim()||scanning}>
              {scanning ? <><div className="loader" style={{ width:14, height:14 }}/> {t('scanner.searching')}</> : t('action.search')}
            </button>
          </div>

          {result && (
            <div className="card" style={{ border:`1px solid ${result.blocked?'rgba(239,68,68,0.3)':'var(--border-active)'}`, animation:'fadeUp 0.3s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:20 }}>{result.blocked ? 'blocked' : result.lot.status==='AUTHENTIQUE' ? 'ok' : 'warn'}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{result.lot.lot_id}</span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                <StatusBadge status={result.lot.status}/>
                <MineralBadge type={result.lot.mineral_type}/>
                {result.lot.token_id != null && <span className="badge badge-certified">NFT #{result.lot.token_id}</span>}
              </div>
              {result.blocked ? (
                <div style={{ padding:'10px 14px', background:'var(--crimson-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--r-md)', fontSize:'0.82rem', color:'var(--crimson)' }}>
                   Lot non autorisé au transport
                  {result.lot.status==='SUSPECT' && ' — Statut SUSPECT'}
                  {!result.lot.regulator_validated && result.lot.status!=='SUSPECT' && ` — ${t('trans.awaiting_dgmr')}`}
                </div>
              ) : (
                <>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:12 }}>
                    {result.lot.site} · {fmt.date(result.lot.analyzed_at)}
                    {result.lot.destination && ` | ${result.lot.destination}`}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--emerald)', marginBottom:12 }}>
                    <Ic name="scale" size={12}/> Validé DGMR: {fmt.date(result.lot.regulator_validated_at)}
                  </div>
                  {result.lot.token_id != null && <button className="btn btn-gold btn-sm" onClick={()=>setShowCert(true)}>{t('action.view_certificate')}</button>}
                </>
              )}
            </div>
          )}
          {notFound && (
            <div className="card" style={{ border:'1px solid rgba(239,68,68,0.2)', background:'var(--crimson-dim)' }}>
              <p style={{ color:'var(--crimson)', fontSize:'0.875rem' }}>{t('scanner.not_found')}</p>
            </div>
          )}
        </div>
      </div>
      {showCert && result?.lot && <CertificateCard lot={result.lot} token={result.token} onClose={()=>setShowCert(false)}/>}
    </div>
  );
}

//  TRANSPORT HISTORY — Registre complet des livraisons 
export function TransportHistoryPage() {
  const { lots, tokens } = useApp();
  const { t } = useI18n();
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [showCert, setShowCert] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const history = lots.filter(l => l.transport_status).filter(l => {
    if (search && !l.lot_id.toLowerCase().includes(search.toLowerCase()) &&
        !(l.destination || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'delivered' && l.transport_status !== 'delivered') return false;
    if (filter === 'in_route'  && l.transport_status !== 'en_route')  return false;
    return true;
  });

  const totalDelivered = lots.filter(l => l.transport_status === 'delivered').length;
  const totalInRoute   = lots.filter(l => l.transport_status === 'en_route').length;
  const totalTonnage   = lots.filter(l => l.transport_status === 'delivered')
    .reduce((s, l) => s + (parseFloat(l.weight_tonnes) || 0), 0);

  const n = history.length; const s = n!==1?'s':'';

  return (
    <div className="page-wrapper">
      <PageHeader title={t('trans.history.title')} subtitle={t('trans.history.subtitle', {n, s})}/>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        <StatCard label="Lots livrés"      value={totalDelivered} icon="check"  color="var(--emerald)"      delay={0}/>
        <StatCard label={t('stat.in_transit')}       value={totalInRoute}   icon="truck" color="var(--brand-light)" delay={100}/>
        <StatCard label="Tonnage livré (t)" value={totalTonnage.toFixed(1)} icon="scale" color="var(--brand)" delay={200}/>
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-input" placeholder="Rechercher lot ou destination…" value={search}
          onChange={e=>setSearch(e.target.value)} style={{ width:220 }}/>
        {[['all',t('trans.filter.all')],['delivered',t('trans.filter.delivered')],['in_route',t('trans.filter.route')]].map(([v,l])=>(
          <button key={v} className={`btn btn-sm ${filter===v?'btn-outline':'btn-ghost'}`}
            onClick={()=>setFilter(v)}>{l}</button>
        ))}
      </div>

      {history.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {history.map(lot => {
            const token  = tokens.find(tk => tk.token_id === lot.token_id);
            const isExp  = expanded === lot.lot_id;
            const isDel  = lot.transport_status === 'delivered';

            const events = [
              { icon:'mine', label:'Extraction', date:fmt.date(lot.extraction_date), done:true },
              { icon:'activity', label:'Analyse IA & Certification', date:fmt.date(lot.analyzed_at), done:true, detail: lot.token_id?`NFT #${lot.token_id}`:null },
              { icon:'scale', label:t('timeline.validation_dgmr'), date:fmt.date(lot.regulator_validated_at), done:!!lot.regulator_validated, detail:lot.regulator_validated?'Approuvé':null },
              { icon:'package', label:'Prise en charge transporteur', date:fmt.date(lot.transferred_at), done:!!lot.transferred_at, detail:lot.destination?`${t('label.destination')}: ${lot.destination}`:null },
              { icon:'truck', label:t('stat.in_transit'), date:fmt.date(lot.transferred_at), done:lot.transport_status==='en_route'||lot.transport_status==='delivered', detail:lot.destination },
              { icon:'factory', label:'Livraison usine', date:fmt.date(lot.delivered_at), done:isDel, detail:isDel?`ok Livré à ${lot.destination}`:null },
            ];

            return (
              <div key={lot.lot_id} className="card" style={{
                border:`1px solid ${isDel?'rgba(16,185,129,0.3)':'var(--border-active)'}`,
                overflow:'hidden',
              }}>
                {/* En-tête lot */}
                <div
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, cursor:'pointer' }}
                  onClick={()=>setExpanded(isExp ? null : lot.lot_id)}
                >
                  <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'0.95rem', color:'var(--gold)' }}>{lot.lot_id}</span>
                    <MineralBadge type={lot.mineral_type}/>
                    <StatusBadge status={lot.status}/>
                    <span className={`badge ${isDel?'badge-authentique':'badge-transport'}`}>
                      {isDel ? t('trans.delivered_badge') : t('trans.in_transit_badge')}
                    </span>
                    {lot.regulator_validated && <span style={{ fontSize:'0.7rem', color:'var(--emerald)' }}><Ic name="scale" size={12}/> DGMR <Ic name="check" size={12}/></span>}
                  </div>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    {lot.token_id != null && (
                      <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();setShowCert({lot,token});}}>
                        <Ic name="certificate" size={14}/> Certificat
                      </button>
                    )}
                    <span style={{ fontSize:14, color:'var(--text-muted)', transition:'transform 0.2s', transform:isExp?'rotate(180deg)':'rotate(0)' }}><Ic name="chevron_down" size={14}/></span>
                  </div>
                </div>

                {/* Résumé toujours visible */}
                <div style={{ display:'flex', gap:24, flexWrap:'wrap', fontSize:'0.82rem', color:'var(--text-secondary)', marginTop:12, paddingTop:12, borderTop:'1px solid var(--border-dim)' }}>
                  <span><Ic name="location" size={13}/> {lot.site}</span>
                  <span><Ic name="factory" size={13}/> {lot.destination || '—'}</span>
                  <span><Ic name="weight" size={13}/> {lot.weight_tonnes?`${lot.weight_tonnes} t`:'—'}</span>
                  <span><Ic name="calendar" size={13}/> Départ: {fmt.date(lot.transferred_at)}</span>
                  {isDel && <span style={{ color:'var(--emerald)' }}>ok Livré: {fmt.date(lot.delivered_at)}</span>}
                  {!isDel && <span style={{ color:'var(--brand-light)' }}><Ic name="truck" size={13}/> En route depuis {fmt.date(lot.transferred_at)}</span>}
                </div>

                {/* Détails expandables */}
                {isExp && (
                  <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--border-dim)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, animation:'fadeUp 0.2s ease' }}>
                    {/* Timeline */}
                    <div>
                      <div className="label" style={{ marginBottom:12, display:'block' }}>Traçabilité complète</div>
                      <Timeline events={events}/>
                    </div>

                    {/* Données lot */}
                    <div>
                      <div className="label" style={{ marginBottom:12, display:'block' }}>Données du lot</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                        {[
                          [t('trans.origin'), lot.site],
                          [t('label.destination'), lot.destination || '—'],
                          [t('label.type'), <MineralBadge type={lot.mineral_type}/>],
                          [t('label.weight'), lot.weight_tonnes?`${lot.weight_tonnes} t`:'—'],
                          [t('label.copper'), lot.cu_grade_percent!=null?`${lot.cu_grade_percent}%`:'—'],
                          [t('label.cobalt'), lot.co_grade_percent!=null?`${lot.co_grade_percent}%`:'—'],
                          [t('label.token'), lot.token_id != null ? `#${lot.token_id}` : 'Non certifié'],
                          [t('label.confidence'), lot.confidence?`${(lot.confidence*100).toFixed(1)}%`:'—'],
                          [t('timeline.validation_dgmr'), lot.regulator_validated?`ok ${fmt.date(lot.regulator_validated_at)}`:'En attente'],
                          [t('label.extraction_date'), fmt.date(lot.extraction_date)],
                          [t('label.analysis_date'), fmt.date(lot.analyzed_at)],
                          [t('label.transfer_date'), fmt.date(lot.transferred_at)],
                          ...(isDel ? [[t('label.delivery_date'), fmt.date(lot.delivered_at)]] : []),
                        ].map(([l,v])=>(
                          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-dim)' }}>
                            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{l}</span>
                            <span style={{ fontSize:'0.82rem', fontWeight:500 }}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Hash blockchain */}
                      {lot.tx_hash && (
                        <div style={{ marginTop:12, padding:'10px 14px', background:'var(--bg-raised)', borderRadius:'var(--r-sm)', border:'1px solid var(--border-gold)' }}>
                          <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>Transaction Hash</div>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--gold)', wordBreak:'break-all' }}>{lot.tx_hash}</div>
                        </div>
                      )}
                      {/* Journal d'audit */}
                      {lot.audit_trail && lot.audit_trail.length > 0 && (
                        <div style={{ marginTop:12 }}>
                          <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                            {t('trans.history.audit')}
                          </div>
                          {lot.audit_trail.map((e, i) => (
                            <div key={i} style={{ display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border-dim)', fontSize:'0.72rem' }}>
                              <span style={{ color:'var(--text-muted)', whiteSpace:'nowrap', fontFamily:'var(--font-mono)' }}>
                                {e.at ? new Date(e.at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}
                              </span>
                              <span style={{ flex:1, color: e.event==='DELIVERED'?'var(--emerald)':e.event==='MARKED_SUSPECT'?'var(--crimson)':e.event==='REGULATOR_VALIDATED'?'var(--emerald)':'var(--text-secondary)', fontWeight:500 }}>
                                {({'LOT_CREATED':t('audit.event.LOT_CREATED'),'NFT_MINTED':t('audit.event.NFT_MINTED'),'REGULATOR_VALIDATED':t('audit.event.REGULATOR_VALIDATED'),'TRANSPORT_STARTED':t('audit.event.TRANSPORT_STARTED'),'DELIVERED':t('audit.event.DELIVERED'),'MARKED_SUSPECT':t('audit.event.MARKED_SUSPECT'),'IPFS_PINNED':t('audit.event.IPFS_PINNED')}[e.event] || e.event.replace(/_/g,' '))}
                                {e.destination && ` | ${e.destination}`}
                                {e.forced && <span style={{ color:'var(--amber)', marginLeft:4 }}>(Forcé)</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon="truck" title={t('history.empty')} subtitle={t('history.empty.subtitle')}/>
        </div>
      )}

      {showCert && <CertificateCard lot={showCert.lot} token={showCert.token} onClose={()=>setShowCert(null)}/>}
    </div>
  );
}


