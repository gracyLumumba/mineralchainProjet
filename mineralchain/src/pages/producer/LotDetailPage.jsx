import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import {
  PageHeader, EmptyState, StatusBadge, MineralBadge,
  ConfidenceGauge, InfoRow, Timeline, ChemistryBar
} from '../../components/common/UI';
import { CertificateCard } from '../../components/common/Certificate';
import { uploadCertificateViaBackend, buildCertificatePayload, pinExistingHash, ipfsGatewayUrl, shortIpfsHash } from '../../services/ipfs';
import { fmt } from '../../contexts/AppContext';

import { Ic } from '../../components/common/Icons';

export default function LotDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lots, tokens, updateLot, addToast } = useApp();
  const { t } = useI18n();
  const lot = lots.find(l => l.lot_id === id);
  const token = lot ? tokens.find(tk => tk.token_id === lot.token_id) : null;
  const [showCert, setShowCert] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [destination, setDestination] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [uploadingIpfs, setUploadingIpfs] = useState(false);
  const [pinning, setPinning] = useState(false);

  const handleTransfer = async () => {
    void destination;
    void setShowTransfer;
    void setTransferring;
  };

  if (!lot) return (
    <div className="page-wrapper">
      <EmptyState icon="?" title={t('lotdetail.not_found')} subtitle={id}
        action={<button className="btn btn-outline" onClick={() => navigate('/producer/my-lots')}>{t('action.back')}</button>}/>
    </div>
  );

  const handleUploadIpfs = async () => {
    setUploadingIpfs(true);
    try {
      const certPayload = buildCertificatePayload(lot, token);
      const ipfsResult  = await uploadCertificateViaBackend(certPayload);
      updateLot(lot.lot_id, { ipfs_hash: ipfsResult.ipfs_hash, ipfs_url: ipfsResult.gateway_url });
      addToast(`⬡ Certificat épinglé sur IPFS · ${ipfsResult.ipfs_hash.slice(0, 16)}…`, 'success');
    } catch (err) {
      addToast(`⬡ IPFS non disponible : ${err.message}`, 'warning');
    } finally { setUploadingIpfs(false); }
  };

  const handleRepin = async () => {
    if (!lot.ipfs_hash) return;
    setPinning(true);
    try {
      await pinExistingHash(lot.ipfs_hash, lot.lot_id);
      addToast('Hash re-pinné sur IPFS', 'success');
    } catch (err) {
      addToast(`⬡ Re-pin échoué : ${err.message}`, 'warning');
    } finally { setPinning(false); }
  };

  const timelineEvents = [
    { icon: 'mine', label: t('timeline.extraction'),   date: fmt.date(lot.extraction_date), done: true },
    { icon: '◈', label: t('timeline.analysis'),      date: fmt.date(lot.analyzed_at), done: true, detail: lot.status },
    { icon: '◎', label: t('timeline.certification'), date: lot.token_id != null ? fmt.date(lot.analyzed_at) : null, done: lot.token_id != null, detail: lot.token_id != null ? `Token #${lot.token_id}` : null },
    { icon: 'truck', label: t('timeline.transit'),       date: lot.transferred_at ? fmt.date(lot.transferred_at) : null, done: !!lot.transport_status, detail: lot.destination || null },
    { icon: 'scale', label: t('timeline.validation_dgmr'), date: lot.regulator_validated_at ? fmt.date(lot.regulator_validated_at) : null, done: !!lot.regulator_validated, detail: lot.regulator_validated ? `${t('trans.validated_dgmr')}` : lot.status === 'SUSPECT' ? `${t('status.SUSPECT')}` : `${t('trans.awaiting_dgmr')}` },
    { icon: '⬡', label: 'IPFS', date: lot.ipfs_hash ? 'Permanent' : null, done: !!lot.ipfs_hash, detail: lot.ipfs_hash ? shortIpfsHash(lot.ipfs_hash) : null },
    { icon: 'factory', label: t('timeline.delivery'),      date: lot.delivered_at ? fmt.date(lot.delivered_at) : null, done: lot.transport_status === 'delivered' },
  ];

  const impLabel = lot.impurity_level === 'low' ? t('impurity.low') : lot.impurity_level === 'medium' ? t('impurity.medium') : t('impurity.high');

  return (
    <div className="page-wrapper">
      <PageHeader
        title={lot.lot_id}
        subtitle={`${t('lotdetail.title')} · ${t('label.site')} ${lot.site}`}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/producer/my-lots')}>{t('action.back')}</button>
            {lot.token_id != null && <button className="btn btn-outline btn-sm" onClick={() => setShowCert(true)}>{t('action.view_certificate')}</button>}
            {!lot.transport_status && (
              lot.regulator_validated ? (
                <div style={{ padding:'8px 14px', background:'var(--emerald-dim)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'var(--r-md)', fontSize:'0.78rem' }}>
                  <div style={{ color:'var(--emerald)', fontWeight:700, marginBottom:4 }}>Lot validé par le régulateur</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>Seul le transporteur peut prendre ce lot en charge pour livraison à l’usine.</div>
                </div>
              ) : lot.status === 'SUSPECT' ? (
                <div style={{ padding:'8px 14px', background:'var(--crimson-dim)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--r-md)', fontSize:'0.78rem' }}>
                  <div style={{ color:'var(--crimson)', fontWeight:700, marginBottom:4 }}>{t('transfer.blocked.suspect')}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>{t('transfer.blocked.hint')}</div>
                </div>
              ) : (
                <div style={{ padding:'8px 14px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--r-md)', fontSize:'0.78rem' }}>
                  <div style={{ color:'var(--amber)', fontWeight:700, marginBottom:4 }}>{t('transfer.blocked.pending')}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>{t('transfer.blocked.hint')}</div>
                </div>
              )
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* IA Results */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>{t('lotdetail.ia_results')}</h3>
              <div style={{ display: 'flex', gap: 8 }}><StatusBadge status={lot.status}/><MineralBadge type={lot.mineral_type}/></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              <ConfidenceGauge value={lot.confidence || 0} size={130}/>
              <div style={{ flex: 1, minWidth: 220, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {[
                  [t('label.mineral_type'), lot.mineral_type === 'copper' ? `⬡ ${t('mineral.copper')}` : lot.mineral_type === 'cobalt' ? `◈ ${t('mineral.cobalt')}` : `◎ ${t('mineral.mixed')}`],
                  [t('label.impurities'), impLabel],
                  [t('label.fraud'), lot.is_fraud ? t('fraud.yes') : t('fraud.no')],
                  [t('label.site'), lot.site],
                  [t('label.analysis_date'), fmt.date(lot.analyzed_at)],
                  [t('label.weight'), lot.weight_tonnes ? `${lot.weight_tonnes} t` : '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chemistry */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 20 }}>{t('lotdetail.chemistry')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                [t('label.copper'), lot.cu_grade_percent, 15, 'var(--copper-light)'],
                [t('label.cobalt'), lot.co_grade_percent, 8,  'var(--brand-light)'],
                [t('label.iron'),   lot.fe_percent,       30, 'var(--text-secondary)'],
                [t('label.nickel'), lot.ni_percent,       3,  '#a78bfa'],
                [t('label.sulfur'), lot.s_percent,        10, 'var(--amber)'],
                [t('label.silica'), lot.silica_percent,   20, 'var(--text-muted)'],
              ].filter(([, v]) => v != null && v !== '').map(([label, value, max, color]) => (
                <ChemistryBar key={label} label={label} value={Number(value)} max={max} color={color}/>
              ))}
            </div>
          </div>

          {/* Physical */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 20 }}>{t('lotdetail.physical')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                [t('label.density'),  lot.density_t_m3,    't/m³'],
                [t('label.moisture'), lot.moisture_percent, '%'],
                [t('label.hardness'), lot.hardness_mohs,    'Mohs'],
                [t('label.weight'),   lot.weight_tonnes,    't'],
              ].map(([label, value, unit]) => (
                <div key={label} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', padding: '14px 16px', border: '1px solid var(--border-dim)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>
                    {value != null && value !== '' ? Number(value).toFixed(2) : '—'}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain */}
          {lot.token_id != null && (
            <div className="card" style={{ border: '1px solid var(--border-active)', background: 'linear-gradient(135deg, var(--brand-dim) 0%, transparent 60%)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 18, color: 'var(--brand)' }}>{t('lotdetail.blockchain')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <InfoRow label={t('label.token_id')} value={`#${lot.token_id}`} highlight/>
                <InfoRow label={t('label.network')} value="Ganache · localhost:7545"/>
                <InfoRow label={t('label.owner')} value={fmt.hash(token?.owner)} mono/>
                <InfoRow label={t('label.contract')} value={fmt.hash('0xE7A51a1136968A33fE06bAc07B5794757E349Fbb', 10)} mono/>
              </div>
              {lot.tx_hash && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('label.tx_hash')}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'var(--bg-raised)', padding: '10px 14px', borderRadius: 'var(--r-sm)', wordBreak: 'break-all', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)' }}>
                    {lot.tx_hash}
                  </div>
                </div>
              )}
              <button className="btn btn-gold btn-sm" style={{ marginTop: 16 }} onClick={() => setShowCert(true)}>
                {t('action.view_certificate')}
              </button>
            </div>
          )}

          {/* IPFS */}
          {lot.token_id != null && (
            <div className="card" style={{ border: '1px solid rgba(139,92,246,0.25)', background: 'var(--violet-dim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--violet)' }}>
                  ⬡ IPFS — Stockage Décentralisé
                </h3>
                {lot.ipfs_hash
                  ? <span className="badge badge-ipfs">ok Épinglé</span>
                  : <span className="badge" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px dashed rgba(139,92,246,0.3)' }}>Non épinglé</span>
                }
              </div>

              {lot.ipfs_hash ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 14 }}>
                    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border-dim)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hash IPFS (CID)</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--violet)', wordBreak: 'break-all' }}>{lot.ipfs_hash}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a href={ipfsGatewayUrl(lot.ipfs_hash)} target="_blank" rel="noopener noreferrer" className="btn btn-ipfs btn-sm">↗ Voir sur Gateway</a>
                    <button className="btn btn-ghost btn-sm" onClick={handleRepin} disabled={pinning}>
                      {pinning ? '⬡ Pinning…' : 'Re-pinner'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                    Stockez ce certificat sur IPFS pour une conservation permanente et décentralisée.
                  </p>
                  <button className="btn btn-ipfs" onClick={handleUploadIpfs} disabled={uploadingIpfs} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {uploadingIpfs ? <><div className="loader" style={{ width: 14, height: 14, borderTopColor: '#fff' }}/> Upload…</> : '⬡ Upload vers IPFS'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail — Journal de traçabilité */}
          {lot.audit_trail && lot.audit_trail.length > 0 && (
            <div className="card" style={{ border:'1px solid rgba(139,92,246,0.2)' }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:14 }}>
                 Journal de traçabilité sécurisé
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {lot.audit_trail.map((entry, i) => {
                  const icons = {
                    LOT_CREATED:'mine', NFT_MINTED:'gem', REGULATOR_VALIDATED:'scale',
                    TRANSPORT_STARTED:'truck', DELIVERED:'factory', MARKED_SUSPECT:'alert',
                    IPFS_PINNED:'gem',
                  };
                  const colors = {
                    LOT_CREATED:'var(--gold)', NFT_MINTED:'var(--gold)',
                    REGULATOR_VALIDATED: entry.forced ? 'var(--amber)' : entry.status === 'SUSPECT' ? 'var(--crimson)' : 'var(--emerald)',
                    TRANSPORT_STARTED:'var(--brand-light)', DELIVERED:'var(--emerald)',
                    MARKED_SUSPECT:'var(--crimson)', IPFS_PINNED:'var(--violet)',
                  };
                  const c = colors[entry.event] || 'var(--text-muted)';
                  return (
                    <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom: i < lot.audit_trail.length-1 ? '1px solid var(--border-dim)' : 'none', alignItems:'flex-start' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:`${c}22`, border:`1px solid ${c}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13 }}>
                        {icons[entry.event] || '○'}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                          <span style={{ fontSize:'0.82rem', fontWeight:600, color:c }}>
                            {t('audit.event.' + entry.event) || entry.event.replace(/_/g,' ')}
                            {entry.forced && <span style={{ marginLeft:6, fontSize:'0.7rem', color:'var(--amber)', fontWeight:400 }}>{t('audit.forced')}</span>}
                          </span>
                          <span style={{ fontSize:'0.7rem', fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>
                            {entry.at ? new Date(entry.at).toLocaleString('fr-FR') : '—'}
                          </span>
                        </div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
                          {entry.destination && <span>→ {entry.destination}</span>}
                          {entry.token_id != null && <span>NFT #{entry.token_id}</span>}
                          {entry.signature   && <span style={{ fontFamily:'var(--font-mono)' }}>sig: {entry.signature}</span>}
                          {entry.params_compared != null && <span>{entry.conformes}/{entry.params_compared} params conformes</span>}
                          {entry.fraud_alerts?.length > 0 && <span style={{ color:'var(--crimson)' }}> {entry.fraud_alerts.join(', ')}</span>}
                          {entry.ipfs_hash   && <span style={{ fontFamily:'var(--font-mono)', color:'var(--violet)' }}>{entry.ipfs_hash.slice(0,16)}…</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {lot.integrity_hash && (
                <div style={{ marginTop:12, padding:'8px 12px', background:'var(--bg-raised)', borderRadius:'var(--r-sm)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{t('audit.integrity')}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--violet)' }}>{lot.integrity_hash}</span>
                </div>
              )}

              {/* ── Motif de décision régulateur ─────────────────────── */}
              {(lot.regulator_validated || lot.status === 'SUSPECT') && (
                <div style={{
                  marginTop:12, padding:'12px 14px',
                  background: lot.status==='SUSPECT' ? 'var(--crimson-dim)' : lot.validation_forced ? 'var(--amber-dim)' : 'var(--emerald-dim)',
                  border:`1px solid ${lot.status==='SUSPECT'?'rgba(239,68,68,0.25)':lot.validation_forced?'rgba(245,158,11,0.25)':'rgba(16,185,129,0.25)'}`,
                  borderRadius:'var(--r-md)',
                }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, color: lot.status==='SUSPECT'?'var(--crimson)':lot.validation_forced?'var(--amber)':'var(--emerald)' }}>
                    {t('history.reason.title')}
                  </div>
                  <div style={{ fontSize:'0.82rem', fontWeight:600, marginBottom: (lot.validation_comparison?.length > 0 || lot.validation_fraud_alerts?.length > 0) ? 8 : 0, color: lot.status==='SUSPECT'?'var(--crimson)':lot.validation_forced?'var(--amber)':'var(--emerald)' }}>
                    {lot.validation_fraud_alerts?.length > 0
                      ? lot.validation_fraud_alerts.map(a => ({
                          ZERO_VALUES:          t('history.reason.fraud_zero'),
                          INSUFFICIENT_DATA:    t('history.reason.fraud_insufficient'),
                          ZERO_MISMATCH:        t('history.reason.fraud_mismatch'),
                          NO_MATCH:             t('history.reason.fraud_insufficient'),
                        }[a.type || a] || a.msg || String(a))).join(' · ')
                      : lot.validation_forced
                        ? t('history.reason.forced', { n: (lot.validation_comparison||[]).filter(r=>!r.ok).length })
                        : lot.status === 'SUSPECT'
                          ? t('history.reason.suspect', { n: (lot.validation_comparison||[]).filter(r=>!r.ok).length })
                          : t('history.reason.validated', { n: (lot.validation_comparison||[]).filter(r=>r.ok).length, total: (lot.validation_comparison||[]).length })
                    }
                  </div>
                  {/* Détail des paramètres hors tolérance */}
                  {(lot.validation_comparison||[]).filter(r=>!r.ok).map((r,i) => (
                    <div key={i} style={{ display:'flex', gap:10, fontSize:'0.75rem', color:'var(--text-secondary)', padding:'4px 0', borderTop:'1px solid var(--border-dim)' }}>
                      <span style={{ color:'var(--crimson)', flexShrink:0 }}>x</span>
                      <span style={{ flex:1 }}>{r.label}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem' }}>
                        {t('analysis.compare.producer')}: {r.prodVal?.toFixed?.(3) ?? r.prodVal}
                        {' · '}{t('analysis.compare.regulator')}: {r.regVal?.toFixed?.(3) ?? r.regVal}
                        {' · '}Δ {typeof r.diff==='number'?r.diff.toFixed(3):r.diff}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pas encore validé */}
              {!lot.regulator_validated && lot.status !== 'SUSPECT' && lot.analyzed_at && (
                <div style={{ marginTop:12, padding:'10px 14px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'var(--r-md)', fontSize:'0.82rem', color:'var(--amber)' }}>
                  {t('history.reason.no_regulator')}
                </div>
              )}
            </div>
          )}

          {/* Transport */}
          {lot.transport_status && (
            <div className="card" style={{ border: '1px solid var(--border-active)', background: 'var(--brand-dim)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--brand)', marginBottom: 14 }}>
                {lot.transport_status === 'delivered' ? t('lotdetail.delivered') : t('lotdetail.in_transit')}
              </h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('label.destination')}: </span><strong>{lot.destination}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('trans.departure')}: </span><strong>{fmt.date(lot.transferred_at)}</strong></div>
                {lot.delivered_at && <div><span style={{ color: 'var(--text-muted)' }}>Livraison: </span><strong>{fmt.date(lot.delivered_at)}</strong></div>}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 22 }}>{t('lotdetail.timeline')}</h3>
            <Timeline events={timelineEvents}/>
          </div>
        </div>
      </div>

      {showCert && <CertificateCard lot={lot} token={token} onClose={() => setShowCert(false)}/>}

      {showTransfer && (
        <div className="verify-overlay" onClick={() => setShowTransfer(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}><Ic name="truck" size={14}/></div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 8, textAlign: 'center' }}>
              {t('lotdetail.transfer.title')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24, textAlign: 'center' }}>
              {t('lotdetail.transfer.subtitle')} — <strong style={{ color: 'var(--brand)' }}>{lot.lot_id}</strong>
            </p>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">{t('label.destination')} *</label>
              <input className="form-input" placeholder={t('lotdetail.transfer.placeholder')}
                value={destination} onChange={e => setDestination(e.target.value)} autoFocus
                onKeyDown={e => e.key === 'Enter' && destination.trim() && handleTransfer()}/>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowTransfer(false)}>{t('action.cancel')}</button>
              <button className="btn btn-gold" onClick={handleTransfer} disabled={!destination.trim() || transferring}>
                {transferring
                  ? <><div className="loader" style={{ width: 14, height: 14, borderTopColor: '#0c0a06' }}/> {t('trans.starting')}...</>
                  : t('action.confirm_transfer')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
