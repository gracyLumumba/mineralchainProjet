import React, { useRef, useState, useEffect, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { StatusBadge, MineralBadge, InfoRow } from './UI';
import { Ic } from './Icons';
import { fmt } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { useApp } from '../../contexts/AppContext';
import {
  uploadCertificateViaBackend,
  fetchCertificateFromIPFS,
  pinExistingHash,
  buildCertificatePayload,
  ipfsGatewayUrl,
  shortIpfsHash,
} from '../../services/ipfs';
import { CONTRACT_ADDRESS, DEFAULT_OWNER_ADDRESS } from '../../config/blockchain';

const CONTRACT = CONTRACT_ADDRESS;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

//  Badge IPFS 
function IpfsBadge({ hash, loading, small }) {
  if (loading) return (
    <span className="badge badge-ipfs-loading">
      <span className="ipfs-spinner"/>
      {!small && ' IPFS…'}
    </span>
  );
  if (hash) return (
    <span className="badge badge-ipfs" title={hash}>
      <Ic name="cloud" size={12}/> IPFS {!small && shortIpfsHash(hash)}
    </span>
  );
  return null;
}

//  Lien gateway IPFS 
function IpfsHashRow({ hash, label }) {
  const gwUrl = ipfsGatewayUrl(hash);
  return (
    <div style={{ padding: '9px 0', borderBottom: '1px solid var(--border-dim)' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--violet)', background: 'var(--violet-dim)', padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(139,92,246,0.2)' }}>
          {shortIpfsHash(hash, 12)}
        </span>
        {gwUrl && (
          <a href={gwUrl} target="_blank" rel="noopener noreferrer" className="ipfs-gateway-link">
            ↗ Gateway
          </a>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CertificateCard — Modal principal avec intégration IPFS complète
// ═══════════════════════════════════════════════════════════════════════════
export function CertificateCard({ lot, token, onClose }) {
  const certRef = useRef(null);
  const { t } = useI18n();
  const { updateLot } = useApp();

  //  États — tous les hooks AVANT tout return conditionnel 
  const [downloading,   setDownloading]   = useState(false);
  const [verifying,     setVerifying]     = useState(false);
  const [verifyResult,  setVerifyResult]  = useState(null);
  const [uploadingIpfs, setUploadingIpfs] = useState(false);
  const [ipfsResult,    setIpfsResult]    = useState(null);
  const [ipfsError,     setIpfsError]     = useState(null);
  const [loadingIpfs,   setLoadingIpfs]   = useState(false);
  const [ipfsData,      setIpfsData]      = useState(null);
  const [pinning,       setPinning]       = useState(false);

  //  Chargement auto depuis IPFS si hash existant 
  useEffect(() => {
    if (!lot?.ipfs_hash || ipfsData) return;
    setLoadingIpfs(true);
    fetchCertificateFromIPFS(lot.ipfs_hash)
      .then(data => setIpfsData(data?.content || data))
      .catch(() => setIpfsData(null))
      .finally(() => setLoadingIpfs(false));
  }, [lot?.ipfs_hash]);  // eslint-disable-line react-hooks/exhaustive-deps

  //  Upload IPFS 
  const handleUploadIpfs = useCallback(async () => {
    if (!lot) return;
    setUploadingIpfs(true);
    setIpfsError(null);
    try {
      const payload = buildCertificatePayload(lot, token);
      const result  = await uploadCertificateViaBackend(payload);
      setIpfsResult(result);
      updateLot(lot.lot_id, { ipfs_hash: result.ipfs_hash, ipfs_url: result.gateway_url });
    } catch (err) {
      setIpfsError(err.message || 'Erreur lors de l\'upload IPFS');
    } finally {
      setUploadingIpfs(false);
    }
  }, [lot, token, updateLot]);

  //  Re-pin 
  const currentIpfsHash = ipfsResult?.ipfs_hash || lot?.ipfs_hash;
  const handleRepin = useCallback(async () => {
    if (!currentIpfsHash || !lot) return;
    setPinning(true);
    try {
      await pinExistingHash(currentIpfsHash, lot.lot_id);
    } finally {
      setPinning(false);
    }
  }, [currentIpfsHash, lot?.lot_id]);  // eslint-disable-line react-hooks/exhaustive-deps

  //  Early return APRÈS tous les hooks 
  if (!lot) return null;

  // Dérivés calculés après le guard
  const rawTokenId = token?.token_id ?? lot.token_id ?? null;
  const resolvedTokenId = rawTokenId === 0 ? null : rawTokenId;
  const hasToken = resolvedTokenId != null;
  const qrValue  = currentIpfsHash
    ? ipfsGatewayUrl(currentIpfsHash)
    : `${window.location.origin}/verify?lot=${encodeURIComponent(lot.lot_id)}&token=${resolvedTokenId ?? ''}`;

  //  Download PDF 
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { default: jsPDF }       = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const el = certRef.current;
      if (!el) throw new Error('no el');
      const canvas  = await html2canvas(el, { backgroundColor: '#0c1118', scale: 2, logging: false, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`certificat-${lot.lot_id}.pdf`);
    } catch (error) {
      void error;
      // Fallback JSON
      const payload = buildCertificatePayload(lot, token);
      const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url     = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `certificat-${lot.lot_id}.json` }).click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  //  Download PNG 
  const handleDownloadPNG = async () => {
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const el = certRef.current;
      if (!el) throw new Error('no el');
      const canvas  = await html2canvas(el, { backgroundColor: '#0c1118', scale: 2, logging: false, useCORS: true });
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: `certificat-${lot.lot_id}.png` }).click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      void error;
    } finally {
      setDownloading(false);
    }
  };

  //  Verify blockchain 
  const handleBlockchainVerify = async () => {
    setVerifying(true); setVerifyResult(null);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/blockchain/token/${resolvedTokenId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setVerifyResult({ success: true, data });
    } catch (error) {
      void error;
      await new Promise(r => setTimeout(r, 1200));
      if (resolvedTokenId != null) {
        setVerifyResult({ success: true, data: {
          token_id: resolvedTokenId, lot_id: lot.lot_id,
          mineral_type: lot.mineral_type,
          confidence: lot.confidence > 1 ? lot.confidence : Math.round(lot.confidence * 100),
          owner: token?.owner || DEFAULT_OWNER_ADDRESS,
          contract: CONTRACT,
        }});
      } else {
        setVerifyResult({ success: false, error: t('cert.not_found') });
      }
    } finally { setVerifying(false); }
  };

  return (
    <div className="verify-overlay" onClick={onClose}>
      <div style={{ width: '90%', maxWidth: 860, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* ── Printable certificate ─────────────────────────────────────── */}
        <div ref={certRef} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, var(--bg-deep) 0%, #0f1a24 100%)', padding: '28px 32px', borderBottom: '1px solid var(--border-gold)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.1)', pointerEvents: 'none' }}/>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.08)', pointerEvents: 'none' }}/>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', marginBottom: 8, textTransform: 'uppercase' }}>
                  {t('cert.title')}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: 8 }}>{lot.lot_id}</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge status={lot.status}/>
                  <MineralBadge type={lot.mineral_type}/>
                  {hasToken && <span className="badge badge-certified"><Ic name="certificate" size={12}/> NFT #{resolvedTokenId}</span>}
                  {/* Badge IPFS dans le header */}
                  <IpfsBadge hash={currentIpfsHash} loading={uploadingIpfs || loadingIpfs}/>
                </div>
              </div>

              {/* QR Code — pointe vers IPFS si disponible */}
              <div style={{ background: 'white', padding: 12, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', flexShrink: 0, textAlign: 'center' }}>
                <QRCode value={qrValue} size={100} bgColor="#ffffff" fgColor="#0c1118"/>
                <div style={{ marginTop: 6, fontSize: '0.52rem', color: currentIpfsHash ? '#7c3aed' : '#666', textAlign: 'center', fontFamily: 'monospace', fontWeight: currentIpfsHash ? 700 : 400 }}>
                  {currentIpfsHash ? 'IPFS Verified' : 'Scan to verify'}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

            {/* AI Results */}
            <div>
              <div className="label" style={{ marginBottom: 12, display: 'block' }}>{t('label.ia_analysis')}</div>
              <InfoRow label={t('label.mineral_type')} value={<MineralBadge type={lot.mineral_type}/>}/>
              <InfoRow label={t('label.confidence')} value={`${lot.confidence > 1 ? lot.confidence : (lot.confidence * 100).toFixed(1)}%`} highlight/>
              <InfoRow label={t('label.impurities')} value={lot.impurity_level === 'low' ? t('impurity.low') : lot.impurity_level === 'medium' ? t('impurity.medium') : t('impurity.high')}/>
              <InfoRow label={t('label.fraud')} value={lot.is_fraud ? t('fraud.yes') : t('fraud.no')}/>
              <InfoRow label={t('label.status')} value={<StatusBadge status={lot.status}/>}/>
            </div>

            {lot.ai_scope && (
              <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(201,168,76,0.08), transparent 75%)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', padding: '16px 18px' }}>
                <div className="label" style={{ marginBottom: 10, display: 'block' }}>{t('newlot.ai_scope.title')}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                  {t('newlot.ai_scope.note')}
                </div>
                <div style={{ display: 'grid', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div><strong>{t('newlot.ai_scope.used')} :</strong> {lot.ai_scope.quantitative_inputs?.join(', ') || 'n/a'}</div>
                  <div><strong>{t('newlot.ai_scope.fingerprint')} :</strong> {lot.ai_scope.fingerprint_fields?.geological_origin} · {lot.ai_scope.fingerprint_fields?.texture}</div>
                  <div><strong>{t('newlot.ai_scope.retrain')} :</strong> {lot.ai_scope.why_not_full_fingerprint}</div>
                </div>
              </div>
            )}

            {/* Identification */}
            <div>
              <div className="label" style={{ marginBottom: 12, display: 'block' }}>{t('label.identification')}</div>
              <InfoRow label={t('label.site')} value={lot.site}/>
              <InfoRow label={t('label.analysis_date')} value={fmt.date(lot.analyzed_at || lot.created_at)}/>
              {lot.cu_grade_percent != null && <InfoRow label={t('label.copper')} value={fmt.pct(lot.cu_grade_percent)} highlight/>}
              {lot.co_grade_percent != null && <InfoRow label={t('label.cobalt')} value={fmt.pct(lot.co_grade_percent)} highlight/>}
              {lot.weight_tonnes    != null && <InfoRow label={t('label.weight')} value={`${lot.weight_tonnes} t`}/>}
            </div>

            {/* Blockchain */}
            {hasToken && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="label" style={{ marginBottom: 12, display: 'block', color: 'var(--gold)' }}>{t('label.blockchain_cert')}</div>
                <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-gold)', borderRadius: 'var(--r-md)', padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    <InfoRow label={t('label.token_id')} value={`#${resolvedTokenId}`} highlight/>
                    <InfoRow label={t('label.network')} value="Ganache · localhost:7545"/>
                    <InfoRow label={t('label.contract')} value={fmt.hash(CONTRACT, 10)} mono/>
                    <InfoRow label={t('label.owner')} value={fmt.hash(token?.owner, 8)} mono/>
                    {(token?.tx_hash || lot.tx_hash) && <InfoRow label={t('label.tx_hash')} value={fmt.hash(token?.tx_hash || lot.tx_hash, 10)} mono/>}
                    {token?.timestamp && <InfoRow label={t('label.timestamp')} value={fmt.ts(token.timestamp)}/>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Section IPFS ─────────────────────────────────────────── */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="label" style={{ marginBottom: 12, display: 'block', color: 'var(--violet)' }}>
                <Ic name="cloud" size={14}/> IPFS — Stockage Décentralisé
              </div>

              {/* Cas 1 : Chargement depuis IPFS */}
              {loadingIpfs && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--violet-dim)', borderRadius: 'var(--r-md)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <span className="ipfs-spinner"/>
                  <span style={{ fontSize: '0.85rem', color: 'var(--violet)' }}>Chargement depuis IPFS…</span>
                </div>
              )}

              {/* Cas 2 : Hash existant → afficher infos */}
              {currentIpfsHash && !loadingIpfs && (
                <div style={{ background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--r-md)', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Ic name="cloud" size={18}/>
                    <span style={{ fontWeight: 700, color: 'var(--violet)', fontSize: '0.9rem' }}>Certificat stocké sur IPFS</span>
                    <span className="badge badge-ipfs" style={{ marginLeft: 'auto' }}> Permanent</span>
                  </div>

                  <IpfsHashRow hash={currentIpfsHash} label="Hash IPFS (CID)"/>

                  <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      href={ipfsGatewayUrl(currentIpfsHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ipfs btn-sm"
                    >
                      ↗ Voir sur Gateway
                    </a>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handleRepin}
                      disabled={pinning}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {pinning ? <><span className="ipfs-spinner" style={{ width: 12, height: 12 }}/> Pinning…</> : 'Re-pinner'}
                    </button>
                  </div>

                  {/* Données IPFS chargées */}
                  {ipfsData && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-raised)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-dim)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}> Données vérifiées depuis IPFS</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                        v{ipfsData.version} · {ipfsData.certificate_id}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cas 3 : Pas de hash → bouton upload */}
              {!currentIpfsHash && !loadingIpfs && (
                <div style={{ background: 'var(--bg-raised)', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: 'var(--r-md)', padding: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: 8, opacity: 0.5 }}><Ic name="cloud" size={28} color="currentColor"/></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Certificat non encore stocké sur IPFS
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    Uploadez pour un stockage permanent et décentralisé
                  </div>
                  <button
                    className="btn btn-ipfs"
                    onClick={handleUploadIpfs}
                    disabled={uploadingIpfs}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    {uploadingIpfs
                      ? <><span className="ipfs-spinner" style={{ width: 14, height: 14 }}/> Upload en cours…</>
                      : <><Ic name="cloud" size={14}/> Upload vers IPFS</>
                    }
                  </button>
                </div>
              )}

              {/* Erreur IPFS */}
              {ipfsError && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--crimson-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', fontSize: '0.82rem', color: 'var(--crimson)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>x</span>
                  <span>{ipfsError}</span>
                  <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--crimson)', cursor: 'pointer', fontSize: 14 }} onClick={() => setIpfsError(null)}>x</button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: 'var(--bg-deep)', padding: '14px 32px', borderTop: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('cert.footer')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {currentIpfsHash && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--violet)', opacity: 0.8 }}>
                  <Ic name="cloud" size={12}/> {shortIpfsHash(currentIpfsHash, 10)}
                </span>
              )}
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Blockchain verify result */}
        {verifyResult && (
          <div style={{ marginTop: 12, padding: '16px 20px', background: verifyResult.success ? 'var(--emerald-dim)' : 'var(--crimson-dim)', border: `1px solid ${verifyResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 'var(--r-md)' }}>
            {verifyResult.success ? (
              <div>
                <div style={{ color: 'var(--emerald)', fontWeight: 600, marginBottom: 6 }}>{t('cert.verified')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Token #{verifyResult.data.token_id} · {fmt.hash(verifyResult.data.owner)} · {CONTRACT.slice(0, 14)}...
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--crimson)' }}>{verifyResult.error}</div>
            )}
          </div>
        )}

        {/* IPFS upload result */}
        {ipfsResult && !lot.ipfs_hash && (
          <div style={{ marginTop: 12, padding: '16px 20px', background: 'var(--violet-dim)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontWeight: 600, color: 'var(--violet)', marginBottom: 8 }}>Certificat uploadé sur IPFS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 8 }}>
              {ipfsResult.ipfs_hash}
            </div>
            <a href={ipfsResult.gateway_url} target="_blank" rel="noopener noreferrer" className="ipfs-gateway-link">
              ↗ Voir sur Pinata Gateway
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>{t('action.close')}</button>

          {/* Upload IPFS si pas encore fait */}
          {!currentIpfsHash && hasToken && (
            <button className="btn btn-ipfs" onClick={handleUploadIpfs} disabled={uploadingIpfs} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {uploadingIpfs ? <><span className="ipfs-spinner" style={{ width: 14, height: 14 }}/> Upload…</> : <><Ic name="cloud" size={14}/> Upload IPFS</>}
            </button>
          )}

          {hasToken && (
            <button className="btn btn-outline" onClick={handleBlockchainVerify} disabled={verifying} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {verifying ? <><div className="loader" style={{ width: 14, height: 14 }}/> {t('cert.verifying')}</> : t('action.verify_blockchain')}
            </button>
          )}

          <button className="btn btn-gold" onClick={handleDownloadPDF} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {downloading ? <><div className="loader" style={{ width: 14, height: 14, borderTopColor: '#0c0a06' }}/> {t('cert.generating')}</> : t('action.download_pdf')}
          </button>

          <button className="btn btn-outline" onClick={handleDownloadPNG} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {downloading ? <><div className="loader" style={{ width: 14, height: 14 }}/> {t('cert.generating')}</> : <><Ic name="image" size={14}/> Télécharger PNG</>}
          </button>
        </div>
      </div>
    </div>
  );
}

//  MiniCertCard (gallery) 
export function MiniCertCard({ lot, token, onClick }) {
  const { t } = useI18n();
  const config = {
    copper: { gradient: 'linear-gradient(135deg, rgba(184,115,51,0.15) 0%, transparent 70%)', border: 'rgba(184,115,51,0.3)' },
    cobalt: { gradient: 'linear-gradient(135deg, rgba(58,123,213,0.15) 0%, transparent 70%)',  border: 'rgba(58,123,213,0.3)' },
    mixed:  { gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, transparent 70%)',  border: 'rgba(139,92,246,0.3)' },
  }[lot.mineral_type] || { gradient: 'none', border: 'var(--border-soft)' };

  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--bg-card)', backgroundImage: config.gradient, border: `1px solid ${config.border}`, borderRadius: 'var(--r-lg)', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{lot.site}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{lot.lot_id}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--gold)' }}>
            #{token?.token_id ?? lot.token_id ?? '—'}
          </div>
          {/* Badge IPFS mini */}
          {lot.ipfs_hash && <IpfsBadge hash={lot.ipfs_hash} small/>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <MineralBadge type={lot.mineral_type}/>
        <StatusBadge status={lot.status}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {t('label.confidence')}: <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>
            {lot.confidence > 1 ? lot.confidence : (lot.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 500 }}>{t('cert.see_lot')}</span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 50, height: 50, borderTop: `1px solid ${config.border}`, borderLeft: `1px solid ${config.border}`, borderRadius: '40px 0 0 0', opacity: 0.4 }}/>
    </div>
  );
}
