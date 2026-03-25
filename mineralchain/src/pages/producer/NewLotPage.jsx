import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { useNotif, NOTIF_TYPES } from '../../contexts/NotifContext';
import { apiService, simulateAnalysis } from '../../services/api';
import { ConfidenceGauge, Loader, PageHeader, StatusBadge, MineralBadge } from '../../components/common/UI';
import { CertificateCard } from '../../components/common/Certificate';
import { uploadCertificateViaBackend, buildCertificatePayload } from '../../services/ipfs';

const DEFAULT_VALS = {
  site: 'KAMOA',
  extraction_date: new Date().toISOString().split('T')[0],
  cu_grade_percent: '', co_grade_percent: '', fe_percent: '',
  ni_percent: '', s_percent: '', silica_percent: '',
  density_t_m3: '', moisture_percent: '', hardness_mohs: '', weight_tonnes: '',
};

const genLotId = (site) => {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const n = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `${site}-${y}${m}-${n}`;
};

// Normalise la réponse backend quel que soit le format retourné
const normalizeIaResult = (res) => {
  if (res?.ia_result) return res.ia_result;
  if (res?.ia_analysis) {
    return {
      mineral_type:  res.ia_analysis?.mineral?.type   ?? 'unknown',
      confidence:    res.ia_analysis?.mineral?.confidence ?? 0,
      impurity_level:res.ia_analysis?.impurity?.level ?? 'unknown',
      is_fraud:      res.ia_analysis?.fraud?.is_fraud ?? false,
      status:        res?.status ?? 'À VÉRIFIER',
    };
  }
  return { mineral_type: 'unknown', confidence: 0, impurity_level: 'unknown', is_fraud: false, status: 'À VÉRIFIER' };
};

const normalizeTokenId = (tokenId, lotId) => {
  if (tokenId == null) return null;
  if (Number(tokenId) !== 0) return tokenId;
  const text = String(lotId || 'mineralchain');
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(31, hash) + text.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 900000) + 1000;
};

export default function NewLotPage() {
  const navigate = useNavigate();
  const { addLot, addToken, addToast, lots, updateLot } = useApp();
  const { notify } = useNotif();
  const { t } = useI18n();
  const [mode, setMode] = useState(null);
  const [result, setResult] = useState(null);
  const [showCert, setShowCert] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { lot_id: genLotId('KAMOA'), ...DEFAULT_VALS },
  });
  const site = watch('site');

  React.useEffect(() => {
    setValue('lot_id', genLotId(site));
  }, [site, setValue]);

  const onSubmit = async (data, submitMode) => {
    setMode(submitMode);
    setResult(null);
    if (lots.find(l => l.lot_id === data.lot_id)) {
      addToast(t('newlot.error.duplicate', { id: data.lot_id }), 'error');
      setMode(null);
      return;
    }
    const payload = { ...data };
    ['cu_grade_percent','co_grade_percent','fe_percent','ni_percent','s_percent',
     'silica_percent','density_t_m3','moisture_percent','hardness_mohs','weight_tonnes',
    ].forEach(k => { if (payload[k] !== '') payload[k] = parseFloat(payload[k]); });

    try {
      let res;
      if (submitMode === 'analyze') {
        try {
          res = await apiService.analyze(payload);
        } catch (backendErr) {
          console.warn('[BACKEND] Analyse — fallback simulation:', backendErr);
          res = simulateAnalysis(payload);
          res._simulated = true;
        }
      } else {
        // certify — doit passer par le backend + Ganache
        res = await apiService.certify(payload);
      }

      const iaResult = normalizeIaResult(res);
      const normalizedTokenId = normalizeTokenId(res.blockchain?.token_id, data.lot_id);
      // token_id peut être 0 (premier token Ganache) — on utilise != null
      const hasBlockchain = res.blockchain != null && normalizedTokenId != null;
      const backendIpfsHash = res.certificate?.ipfs_hash ?? null;
      const backendIpfsUrl = res.certificate?.gateway_url ?? null;

      const lot = {
        lot_id: data.lot_id, site: data.site, extraction_date: data.extraction_date,
        created_at: new Date().toISOString(), analyzed_at: new Date().toISOString(),
        mineral_type: iaResult.mineral_type, confidence: iaResult.confidence,
        impurity_level: iaResult.impurity_level, is_fraud: iaResult.is_fraud,
        status: iaResult.status,
        cu_grade_percent: payload.cu_grade_percent, co_grade_percent: payload.co_grade_percent,
        fe_percent: payload.fe_percent, ni_percent: payload.ni_percent,
        s_percent: payload.s_percent, silica_percent: payload.silica_percent,
        density_t_m3: payload.density_t_m3, moisture_percent: payload.moisture_percent,
        hardness_mohs: payload.hardness_mohs, weight_tonnes: payload.weight_tonnes,
        token_id: hasBlockchain ? normalizedTokenId : null,
        tx_hash: res.blockchain?.transaction_hash || null,
        transport_status: null,
        ipfs_hash: backendIpfsHash,
        ipfs_url: backendIpfsUrl,
      };

      addLot(lot);

      if (hasBlockchain) {
        addToken({
          token_id:   normalizedTokenId,
          lot_id:     data.lot_id,
          mineral_type: iaResult.mineral_type,
          confidence: Math.round((iaResult.confidence || 0) * 100),
          status:     iaResult.status,
          tx_hash:    res.blockchain.transaction_hash,
          contract:   res.blockchain.contract_address,
          block:      res.blockchain.block_number,
          gas_used:   res.blockchain.gas_used,
          owner:      '0xdb5745DeeDcF8e6e0099460bf94c96b56804EC70',
          timestamp:  res.blockchain.timestamp || Math.floor(Date.now() / 1000),
        });
      }

      const tokenObj = hasBlockchain ? {
          token_id:  normalizedTokenId,
        tx_hash:   res.blockchain.transaction_hash,
        owner:     '0xdb5745DeeDcF8e6e0099460bf94c96b56804EC70',
        timestamp: res.blockchain.timestamp,
      } : null;

      // Auto-upload IPFS après certification réussie
      if (submitMode === 'certify' && hasBlockchain && !backendIpfsHash) {
        try {
          const certPayload = buildCertificatePayload(lot, tokenObj);
          const ipfsResult  = await uploadCertificateViaBackend(certPayload);
          lot.ipfs_hash = ipfsResult.ipfs_hash;
          lot.ipfs_url  = ipfsResult.gateway_url;
          updateLot(lot.lot_id, { ipfs_hash: ipfsResult.ipfs_hash, ipfs_url: ipfsResult.gateway_url });
          addToast(`⬡ Certificat épinglé sur IPFS · ${ipfsResult.ipfs_hash.slice(0, 16)}…`, 'success');
        } catch (ipfsErr) {
          console.warn('[IPFS] Auto-upload échoué (non bloquant):', ipfsErr.message);
          addToast('⬡ Upload IPFS non disponible — vous pourrez le faire manuellement', 'warning');
        }
      } else if (backendIpfsHash) {
        updateLot(lot.lot_id, { ipfs_hash: backendIpfsHash, ipfs_url: backendIpfsUrl });
      }

      setResult({ lot, blockchain: hasBlockchain ? res.blockchain : null, token: tokenObj });

      if (submitMode === 'certify') {
        if (hasBlockchain) {
          addToast(t('newlot.success.certify', { id: res.blockchain.token_id }), 'success');
        } else {
          const blockchainReason = res.blockchain_error || 'Ganache hors ligne ou mint refuse par le contrat';
          addToast(`Statut: ${lot.status} - NFT non cree (${blockchainReason})`, 'warning');
        }
      } else {
        addToast(t('newlot.success.analyze'), 'success');
      }
      notify(NOTIF_TYPES.LOT_ANALYZED, { lotId: lot.lot_id, confidence: iaResult.confidence, status: iaResult.status });
      if (hasBlockchain) {
        notify(NOTIF_TYPES.NFT_MINTED, { lotId: lot.lot_id, tokenId: res.blockchain.token_id, txHash: res.blockchain.transaction_hash });
      }
    } catch (err) {
      console.error('[CERTIFY] Erreur:', err);
      addToast(`Erreur: ${err.error || err.message || 'Erreur inconnue'}`, 'error');
    } finally { setMode(null); }
  };

  const SectionDiv = ({ labelKey, color = 'var(--text-muted)', children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ height: 1, width: 24, background: color, opacity: 0.4 }}/>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color, textTransform: 'uppercase' }}>{t(labelKey)}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>{children}</div>
    </div>
  );

  const Field = ({ labelKey, name, type = 'number', required, unit, opts = {} }) => (
    <div className="form-group">
      <label className="form-label">
        {t(labelKey)}{unit && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>({unit})</span>}
        {required && <span style={{ color: 'var(--crimson)', marginLeft: 3 }}>*</span>}
      </label>
      <input type={type} className={`form-input ${errors[name] ? 'error' : ''}`}
        {...register(name, { required: required ? t('hint.required') : false, ...opts })}
        step={type === 'number' ? '0.01' : undefined} placeholder={type === 'number' ? '0.00' : ''}
      />
      {errors[name] && <span style={{ color: 'var(--crimson)', fontSize: '0.72rem' }}>{errors[name].message}</span>}
    </div>
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t('newlot.title')}
        subtitle={t('newlot.subtitle')}
        actions={result && (
          <button className="btn btn-outline btn-sm" onClick={() => { setResult(null); reset({ lot_id: genLotId(watch('site')), ...DEFAULT_VALS }); }}>
            {t('newlot.btn.new')}
          </button>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 380px' : '1fr', gap: 24 }}>
        {/* Form */}
        <div className="card">
          <SectionDiv labelKey="newlot.section.id" color="var(--brand)">
            <div className="form-group">
              <label className="form-label">{t('label.lot_id')} <span style={{ color: 'var(--crimson)' }}>*</span></label>
              <input type="text" className={`form-input ${errors.lot_id ? 'error' : ''}`} {...register('lot_id', { required: t('hint.required') })}/>
              {errors.lot_id && <span style={{ color: 'var(--crimson)', fontSize: '0.72rem' }}>{errors.lot_id.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">{t('label.site')} <span style={{ color: 'var(--crimson)' }}>*</span></label>
              <select className="form-input" {...register('site', { required: true })}>
                <option value="KANSOKO">KAMOA-kansoko </option>
                <option value="KCC">KCC - Kamoto Copper</option>
              </select>
            </div>
            <Field labelKey="label.extraction_date" name="extraction_date" type="date" required/>
          </SectionDiv>

          <SectionDiv labelKey="newlot.section.chemistry" color="var(--copper)">
            <Field labelKey="label.copper"  name="cu_grade_percent" unit="%" required opts={{ min:0, max:100 }}/>
            <Field labelKey="label.cobalt"  name="co_grade_percent" unit="%" required opts={{ min:0, max:100 }}/>
            <Field labelKey="label.iron"    name="fe_percent"        unit="%" required opts={{ min:0, max:100 }}/>
            <Field labelKey="label.nickel"  name="ni_percent"        unit="%"/>
            <Field labelKey="label.sulfur"  name="s_percent"         unit="%"/>
            <Field labelKey="label.silica"  name="silica_percent"    unit="%"/>
          </SectionDiv>

          <SectionDiv labelKey="newlot.section.physical" color="var(--brand-light)">
            <Field labelKey="label.density"  name="density_t_m3"     unit="t/m³" required/>
            <Field labelKey="label.moisture" name="moisture_percent"  unit="%" required opts={{ step:'0.1' }}/>
            <Field labelKey="label.hardness" name="hardness_mohs"     unit="Mohs" opts={{ step:'0.1', min:0, max:10 }}/>
            <Field labelKey="label.weight"   name="weight_tonnes"     unit="t" required/>
          </SectionDiv>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={handleSubmit(d => onSubmit(d, 'analyze'))} disabled={!!mode} style={{ flex: 1, minWidth: 180 }}>
              {mode === 'analyze' ? <><Loader size={16}/> {t('newlot.analyzing')}</> : t('newlot.btn.analyze')}
            </button>
            <button type="button" className="btn btn-gold" onClick={handleSubmit(d => onSubmit(d, 'certify'))} disabled={!!mode || result?.lot?.status === 'SUSPECT'} style={{ flex: 1, minWidth: 200 }} title={result?.lot?.status === 'SUSPECT' ? 'Impossible de certifier un lot SUSPECT' : ''}>
              {mode === 'certify' ? <><Loader size={16} color="#0c0a06"/> {t('newlot.certifying')}</> : t('newlot.btn.certify')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => reset({ lot_id: genLotId(site), ...DEFAULT_VALS })} disabled={!!mode}>{t('action.reset')}</button>
            {result?.lot?.status === 'SUSPECT' && (
              <div style={{ width: '100%', marginTop: 8, padding: '10px 14px', background: 'var(--crimson-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', fontSize: '0.82rem', color: 'var(--crimson)' }}>
                Ce lot est classé <strong>SUSPECT</strong> — la certification NFT et le transport sont bloqués jusqu'à résolution par le régulateur.
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.4s ease' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="label" style={{ marginBottom: 12, display: 'block' }}>{t('newlot.result.title')}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--brand)', marginBottom: 16 }}>{result.lot.lot_id}</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <ConfidenceGauge value={result.lot.confidence ?? 0} size={140}/>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  [t('label.status'), <StatusBadge status={result.lot.status}/>],
                  [t('label.type'), <MineralBadge type={result.lot.mineral_type}/>],
                  [t('label.impurities'), result.lot.impurity_level === 'low' ? t('impurity.low') : result.lot.impurity_level === 'medium' ? t('impurity.medium') : t('impurity.high')],
                  [t('label.fraud'), result.lot.is_fraud ? t('fraud.yes') : t('fraud.no')],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {result.blockchain && (
              <div className="card" style={{ border: '1px solid var(--border-active)', background: 'linear-gradient(135deg, var(--brand-dim) 0%, transparent 80%)' }}>
                <div className="label" style={{ color: 'var(--brand)', marginBottom: 14, display: 'block' }}>{t('newlot.blockchain.title')}</div>
                {[
                  [t('label.token_id'), `#${result.blockchain.token_id}`],
                  [t('label.block'),    `#${result.blockchain.block_number}`],
                  [t('label.gas_used'), result.blockchain.gas_used?.toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-dim)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--brand)' }}>{v}</span>
                  </div>
                ))}
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('label.tx_hash')}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-all', background: 'var(--bg-raised)', padding: '8px 10px', borderRadius: 'var(--r-sm)' }}>
                    {result.blockchain.transaction_hash}
                  </div>
                </div>
                <button className="btn btn-gold" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }} onClick={() => setShowCert(true)}>
                  {t('action.view_certificate')}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/producer/my-lots')}>{t('newlot.navigate.lots')}</button>
              {result.blockchain && (
                <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/producer/certificates')}>{t('newlot.navigate.certs')}</button>
              )}
            </div>
          </div>
        )}
      </div>

      {showCert && result && (
        <CertificateCard lot={result.lot} token={result.token} onClose={() => setShowCert(false)}/>
      )}
    </div>
  );
}


