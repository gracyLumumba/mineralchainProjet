import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp, fmt } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { Ic } from '../common/Icons';
import QRCode from 'react-qr-code';

// ── Status rendering ───────────────────────────────────────────────────────
function StatusRow({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 0', borderBottom: '1px solid var(--border-dim)', gap: 12,
    }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.85rem', color: accent || 'var(--text-primary)',
        fontWeight: accent ? 700 : 400, textAlign: 'right' }}>
        {value || '—'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC VERIFY PAGE
//  Handles URLs like: /verify?lot=KAMOA-2603-001&token=12345
//  This page is accessible WITHOUT login (public verification)
// ═══════════════════════════════════════════════════════════════════════════
export default function PublicVerifyPage() {
  const [params] = useSearchParams();
  const { lots, tokens } = useApp();
  const { t } = useI18n();

  const [lot,     setLot]     = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Read params from QR code URL
  const lotId   = params.get('lot');
  const tokenId = params.get('token');
  const txHash  = params.get('hash');

  useEffect(() => {
    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (!lotId && !tokenId) {
        setError('Aucun identifiant fourni dans le lien QR');
        setLoading(false);
        return;
      }

      // Search by lot_id first, then by token_id
      const foundLot = lots.find(l =>
        (lotId   && l.lot_id    === lotId) ||
        (tokenId && String(l.token_id) === String(tokenId))
      );

      if (!foundLot) {
        setError(`Lot introuvable : ${lotId || tokenId}`);
        setLoading(false);
        return;
      }

      const foundToken = tokens.find(tk => tk.token_id === foundLot.token_id);
      setLot(foundLot);
      setToken(foundToken || null);
      setLoading(false);
    }, 400);
  }, [lotId, tokenId, lots, tokens]);

  // Status color mapping
  const STATUS = {
    AUTHENTIQUE:  { color: 'var(--brand)',   bg: 'var(--brand-dim)',  label: 'AUTHENTIQUE', icon: 'check' },
    SUSPECT:      { color: 'var(--crimson)', bg: 'var(--crimson-dim)', label: 'SUSPECT',    icon: 'block' },
    'À VÉRIFIER': { color: 'var(--amber)',   bg: 'var(--amber-dim)',  label: 'À VÉRIFIER',  icon: 'alert' },
  };
  const st = lot ? (STATUS[lot.status] || STATUS['À VÉRIFIER']) : null;

  const currentUrl = window.location.href;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="loader" style={{ borderTopColor: 'var(--brand)', borderColor: 'var(--brand-dim)', width: 32, height: 32, borderWidth: 3 }}/>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vérification en cours…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #0d2e29, #166a52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ic name="gem" size={20} color="#fff"/>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              MineralChain
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Verification de certificat
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            background: 'var(--bg-raised)', border: '1px solid rgba(184,50,40,0.25)',
            borderRadius: 'var(--r-lg)', padding: '24px 22px', textAlign: 'center',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--crimson-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Ic name="x" size={22} color="var(--crimson)"/>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Certificat introuvable
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {error}
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-deep)', borderRadius: 'var(--r-md)', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              Ref: ERR-00005 · {lotId || tokenId || 'unknown'}
            </div>
          </div>
        )}

        {/* Found state */}
        {lot && st && (
          <>
            {/* Status banner */}
            <div style={{
              background: st.bg, border: `1.5px solid ${st.color}35`,
              borderRadius: 'var(--r-lg)', padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${st.color}18`,
                border: `2px solid ${st.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ic name={st.icon} size={20} color={st.color}/>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: st.color, fontFamily: 'var(--font-display)' }}>
                  {st.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Confiance IA : {lot.confidence ? (lot.confidence * 100).toFixed(1) + '%' : '—'}
                </div>
              </div>
              {lot.status === 'AUTHENTIQUE' && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <Ic name="check" size={28} color={st.color}/>
                </div>
              )}
            </div>

            {/* Main certificate card */}
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)', padding: '22px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <Ic name="gem" size={16} color="var(--gold-text)"/>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
                  Certificat NFT
                </span>
                {lot.token_id != null && (
                  <span style={{
                    marginLeft: 'auto', padding: '3px 10px', borderRadius: 99,
                    background: 'var(--gold-dim)', color: 'var(--gold-text)',
                    fontSize: '0.72rem', fontWeight: 700,
                    border: '1px solid var(--border-gold)',
                  }}>
                    NFT #{lot.token_id}
                  </span>
                )}
              </div>

              <StatusRow label="Lot ID"         value={lot.lot_id}     accent="var(--brand)"/>
              <StatusRow label="Site"           value={lot.site}/>
              <StatusRow label="Minerai"        value={lot.mineral_type === 'copper' ? 'Cuivre' : lot.mineral_type === 'cobalt' ? 'Cobalt' : 'Mixte'}/>
              <StatusRow label="Teneur Cu"      value={lot.cu_grade_percent != null ? `${lot.cu_grade_percent.toFixed(3)} %` : null}/>
              <StatusRow label="Teneur Co"      value={lot.co_grade_percent != null ? `${lot.co_grade_percent.toFixed(3)} %` : null}/>
              <StatusRow label="Poids"          value={lot.weight_tonnes ? `${lot.weight_tonnes} t` : null}/>
              <StatusRow label="Date extraction" value={fmt.date(lot.extraction_date)}/>
              <StatusRow label="Date analyse"   value={fmt.date(lot.analyzed_at)}/>

              {lot.regulator_validated && (
                <StatusRow
                  label="Validation DGMR"
                  value={`Validé le ${fmt.date(lot.regulator_validated_at)}`}
                  accent="var(--brand)"
                />
              )}

              {lot.transport_status === 'delivered' && (
                <StatusRow
                  label="Livraison"
                  value={`Livré — ${lot.destination || '—'}`}
                  accent="var(--brand)"
                />
              )}
            </div>

            {/* Blockchain info */}
            {lot.token_id != null && (
              <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)', padding: '18px 22px', marginBottom: 16, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Ic name="chain" size={15} color="var(--brand)"/>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem' }}>
                    Blockchain
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--brand)', fontWeight: 600 }}>
                    Ethereum (Ganache)
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    ['Contrat', '0xE7A51a11...349Fbb'],
                    ['Token ID', `#${lot.token_id}`],
                    ['TX Hash', lot.tx_hash ? lot.tx_hash.slice(0, 20) + '…' : txHash ? txHash + '…' : '—'],
                    ['Integrité', lot.integrity_hash || '—'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{l}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '0.72rem' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', background: 'var(--brand-dim)',
                  borderRadius: 'var(--r-sm)', fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 600,
                }}>
                  <Ic name="lock" size={13} color="var(--brand)"/>
                  Certifié et immuable sur la blockchain
                </div>
              </div>
            )}

            {/* IPFS */}
            {lot.ipfs_hash && (
              <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)', padding: '16px 22px', marginBottom: 16, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Ic name="globe" size={15} color="var(--cobalt)"/>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>
                    IPFS
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 8 }}>
                  {lot.ipfs_hash}
                </div>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${lot.ipfs_hash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.78rem', color: 'var(--cobalt)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Ic name="globe" size={12} color="var(--cobalt)"/>
                  Voir sur IPFS Gateway
                </a>
              </div>
            )}

            {/* QR code of this certificate */}
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)', padding: '18px 22px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                QR Code du certificat
              </div>
              <div style={{ display: 'inline-block', padding: 12, background: '#fff', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
                <QRCode value={currentUrl} size={120} bgColor="#ffffff" fgColor="#0d1f1a"/>
              </div>
              <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {currentUrl.slice(0, 60)}…
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-light)' }}>
          MineralChain · Katanga, RDC · Verification publique
        </div>
      </div>
    </div>
  );
}
