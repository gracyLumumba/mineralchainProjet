import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/i18nContext';
import { useNotif, NOTIF_TYPES } from '../../contexts/NotifContext';
import { PageHeader, EmptyState, StatusBadge, MineralBadge } from '../../components/common/UI';
import { fmt } from '../../contexts/AppContext';
import { apiService } from '../../services/api';

import { Ic } from '../../components/common/Icons';

const TOLERANCES = {
  cu_grade_percent: 0.5, co_grade_percent: 0.3, fe_percent: 1.0,
  ni_percent: 0.2, s_percent: 0.5, silica_percent: 1.0,
  density_t_m3: 0.15, moisture_percent: 2.0, hardness_mohs: 0.5, weight_tonnes: 5.0,
};
const LABELS = {
  cu_grade_percent:'Cuivre — Cu (%)', co_grade_percent:'Cobalt — Co (%)',
  fe_percent:'Fer — Fe (%)', ni_percent:'Nickel — Ni (%)', s_percent:'Soufre — S (%)',
  silica_percent:'Silice — SiO₂ (%)', density_t_m3:'Densité (t/m³)',
  moisture_percent:'Humidité (%)', hardness_mohs:'Dureté (Mohs)', weight_tonnes:'Poids (t)',
};
const COL_MAP = {
  cu:'cu_grade_percent','cu%':'cu_grade_percent',cu_grade:'cu_grade_percent',
  cu_grade_percent:'cu_grade_percent',cuivre:'cu_grade_percent',copper:'cu_grade_percent',
  co:'co_grade_percent','co%':'co_grade_percent',co_grade:'co_grade_percent',
  co_grade_percent:'co_grade_percent',cobalt:'co_grade_percent',
  fe:'fe_percent','fe%':'fe_percent',iron:'fe_percent',fer:'fe_percent',
  ni:'ni_percent',nickel:'ni_percent',
  s:'s_percent','s%':'s_percent',sulfur:'s_percent',soufre:'s_percent',
  sio2:'silica_percent',silica:'silica_percent',silice:'silica_percent',
  density:'density_t_m3',densité:'density_t_m3',densite:'density_t_m3',
  moisture:'moisture_percent',humidité:'moisture_percent',humidite:'moisture_percent',
  hardness:'hardness_mohs',dureté:'hardness_mohs',durete:'hardness_mohs',
  weight:'weight_tonnes',poids:'weight_tonnes',
  lot_id:'lot_id',lot:'lot_id',id:'lot_id',
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV : au moins 2 lignes requises.');
  const sep  = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const hdrs = lines[0].split(sep).map(h => COL_MAP[h.trim().toLowerCase().replace(/"/g,'')] || h.trim().toLowerCase());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/"/g,''));
    const row  = {};
    hdrs.forEach((h, i) => { if (vals[i]!==undefined && vals[i]!=='') row[h] = isNaN(+vals[i]) ? vals[i] : +vals[i]; });
    return row;
  });
}

// Normalise une clé d'en-tête : supprime accents, Unicode, unités, espaces
function normalizeKey(k) {
  let s = k.toLowerCase();
  // Supprimer les diacritiques (é→e, è→e, etc.)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Convertir exposants et indices Unicode → chiffres ASCII
  s = s.replace(/\u00b2/g,'2').replace(/\u00b3/g,'3')
       .replace(/\u2082/g,'2').replace(/\u2083/g,'3')
       .replace(/[\u2080-\u2089]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 8272));
  // Supprimer unités entre parenthèses et caractères de ponctuation
  s = s.replace(/\(t\/m[23]\)/g,'').replace(/\(t\/m\)/g,'')
       .replace(/\(mohs\)/g,'').replace(/\(mm\)/g,'')
       .replace(/[(%)\/\\.\s]/g,'');
  return s.trim();
}

// Mapping enrichi après normalisation
const COL_MAP_NORM = {
  'lotid':'lot_id','lot':'lot_id','id':'lot_id',
  'cu':'cu_grade_percent','cugrade':'cu_grade_percent','cuivre':'cu_grade_percent','copper':'cu_grade_percent',
  'co':'co_grade_percent','cograde':'co_grade_percent','cobalt':'co_grade_percent',
  'fe':'fe_percent','fer':'fe_percent','iron':'fe_percent',
  'ni':'ni_percent','nickel':'ni_percent',
  's':'s_percent','soufre':'s_percent','sulfur':'s_percent',
  'sio2':'silica_percent','silice':'silica_percent','silica':'silica_percent',
  'al2o3':'silica_percent',  // Alumine ignorée pour la comparaison (pas dans TOLERANCES)
  'mgo':'silica_percent',    // Magnésie ignorée
  'densite':'density_t_m3','density':'density_t_m3',
  'humidite':'moisture_percent','moisture':'moisture_percent',
  'durete':'hardness_mohs','hardness':'hardness_mohs',
  'poids':'weight_tonnes','weight':'weight_tonnes',
  'mn':'s_percent', // Mn ignoré (pas dans TOLERANCES)
};

async function parseExcel(file) {
  if (!window.XLSX) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const data = await file.arrayBuffer();
  const wb   = window.XLSX.read(data, { type:'array', cellText:false, cellDates:false });
  const ws   = wb.Sheets[wb.SheetNames[0]];

  // Lire toutes les lignes comme tableau brut
  const aoa = window.XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });

  // Trouver la vraie ligne d'en-tête : la première avec >= 4 cellules non vides
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const nonEmpty = aoa[i].filter(v => v !== '' && v !== null && v !== undefined);
    if (nonEmpty.length >= 4) { headerRowIdx = i; break; }
  }

  const rawHeaders = aoa[headerRowIdx];
  const headers    = rawHeaders.map(h => {
    const norm = normalizeKey(String(h));
    // Keep auxiliary lab columns separate so they do not overwrite sulfur/silica.
    if (norm === 'al2o3') return 'al2o3_percent';
    if (norm === 'mgo') return 'mgo_percent';
    if (norm === 'mn') return 'mn_percent';
    return COL_MAP_NORM[norm] || COL_MAP[norm] || norm || h;
  });

  // Construire les objets depuis les lignes de données
  const rows = [];
  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
    const rowArr = aoa[i];
    if (rowArr.every(v => v === '' || v === null || v === undefined)) continue;
    const row = {};
    headers.forEach((h, idx) => {
      const v = rowArr[idx];
      if (v !== '' && v !== null && v !== undefined) {
        row[h] = typeof v === 'number' ? v : (isNaN(+v) ? String(v) : +v);
      }
    });
    rows.push(row);
  }
  return rows;
}

// Hachage SHA-256 léger (djb2) pour signature du résultat
function hashResult(results) {
  const str = results.map(r => `${r.field}:${r.prodVal}:${r.regVal}:${r.diff}:${r.ok}`).join('|');
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return '0x' + (h >>> 0).toString(16).padStart(8,'0');
}

// Fraud detection rules
const FRAUD_RULES = [
  // Tous les champs régulateur à 0 ou proches de 0 → fichier vide / frauduleux
  (regRow) => {
    const numFields = Object.keys(TOLERANCES).filter(f => regRow[f] != null && regRow[f] !== '');
    const allZero   = numFields.every(f => +regRow[f] === 0);
    return allZero && numFields.length > 0
      ? { type:'ZERO_VALUES', msg:'Tous les champs sont à 0 — fichier invalide' }
      : null;
  },
  // Moins de 3 paramètres communs → comparaison insuffisante
  (regRow) => {
    const common = Object.keys(TOLERANCES).filter(f => regRow[f] != null && regRow[f] !== '');
    return common.length < 3
      ? { type:'INSUFFICIENT_DATA', msg:`Seulement ${common.length} paramètre(s) — minimum 3 requis` }
      : null;
  },
  // Régulateur déclare 0 sur un champ où le producteur déclare > 1%
  (regRow, lot) => {
    const suspicious = Object.keys(TOLERANCES).filter(f =>
      regRow[f] != null && lot[f] != null &&
      +regRow[f] === 0 && +lot[f] > 1.0
    );
    return suspicious.length > 0
      ? { type:'ZERO_MISMATCH', msg:`Valeur 0 suspecte pour : ${suspicious.map(f => LABELS[f]).join(', ')}` }
      : null;
  },
];

function buildComparison(lot, regRow) {
  const results    = [];
  let   allOk      = true;
  const fraudAlerts= [];

  // Appliquer les règles anti-fraude
  for (const rule of FRAUD_RULES) {
    const alert = rule(regRow, lot);
    if (alert) { fraudAlerts.push(alert); allOk = false; }
  }

  // Si fraudes détectées → retour immédiat sans comparer
  if (fraudAlerts.length > 0) {
    return {
      results: [],
      allOk:   false,
      fraudAlerts,
      blocked: true,
      signature: hashResult([]),
      comparedAt: new Date().toISOString(),
    };
  }

  // Comparaison champ par champ
  Object.entries(TOLERANCES).forEach(([field, tol]) => {
    const pv = lot[field], rv = regRow[field];
    if (pv == null || rv == null || pv === '' || rv === '') return;
    const diff = Math.abs(+pv - +rv);
    const ok   = diff <= tol;
    if (!ok) allOk = false;
    results.push({ field, label:LABELS[field], prodVal:+pv, regVal:+rv, diff, tolerance:tol, ok });
  });

  // Vérification finale : résultats vides = données insuffisantes
  if (results.length === 0) {
    return {
      results: [], allOk: false,
      fraudAlerts: [{ type:'NO_MATCH', msg:'Aucun paramètre commun entre les deux analyses' }],
      blocked: true,
      signature: hashResult([]),
      comparedAt: new Date().toISOString(),
    };
  }

  return {
    results,
    allOk,
    fraudAlerts: [],
    blocked: false,
    signature:   hashResult(results),
    comparedAt:  new Date().toISOString(),
  };
}

function CompareRow({ item }) {
  const pct = Math.min((item.diff / item.tolerance) * 100, 100);
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 70px 28px',
      gap:'0 10px', alignItems:'center', padding:'10px 16px',
      borderBottom:'1px solid var(--border-dim)',
      background: item.ok ? 'transparent' : 'rgba(239,68,68,0.06)',
    }}>
      <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)', fontWeight:500 }}>{item.label}</span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', color:'var(--brand-light)', textAlign:'right' }}>{item.prodVal.toFixed(3)}</span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', color:'var(--emerald)', textAlign:'right' }}>{item.regVal.toFixed(3)}</span>
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', textAlign:'right', color:item.ok?'var(--text-muted)':'var(--crimson)' }}>Δ {item.diff.toFixed(3)}</span>
        <div style={{ height:4, background:'var(--bg-raised)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', borderRadius:2, background:item.ok?'var(--emerald)':'var(--crimson)' }}/>
        </div>
      </div>
      <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', textAlign:'center' }}>±{item.tolerance}</span>
      <span style={{ fontSize:15, textAlign:'center', fontWeight:700, color:item.ok?'var(--emerald)':'var(--crimson)' }}>{item.ok?'ok':'x'}</span>
    </div>
  );
}

export default function RegulatorAnalysisPage() {
  const { lots, updateLot, addToast } = useApp();
  const { notify } = useNotif();
  const { t } = useI18n();

  const [step,       setStep]       = useState(1);
  const [lotQuery,   setLotQuery]   = useState('');
  const [scanAnim,   setScanAnim]   = useState(false);
  const [foundLot,   setFoundLot]   = useState(null);
  const [notFound,   setNotFound]   = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [matchedRow, setMatchedRow] = useState(null);
  const [fileError,  setFileError]  = useState('');
  const [parsing,    setParsing]    = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [comparison, setComparison] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validatingLotId, setValidatingLotId] = useState(null);
  const fileRef = useRef(null);

  const searchLot = useCallback((q) => {
    const query = (q || lotQuery).trim();
    if (!query) return;
    setNotFound(false); setFoundLot(null); setScanAnim(true);
    setTimeout(() => {
      setScanAnim(false);
      const lot = lots.find(l => l.lot_id.toLowerCase()===query.toLowerCase() || String(l.token_id)===query);
      if (lot) { setFoundLot(lot); setStep(2); }
      else setNotFound(true);
    }, 700);
  }, [lots, lotQuery]);

  const handleFile = useCallback(async (f) => {
    setFileError(''); setParsedRows([]); setMatchedRow(null); setComparison(null);
    setParsing(true);
    try {
      let rows;
      if (f.name.match(/\.xlsx?$/i)) rows = await parseExcel(f);
      else { const txt = await f.text(); rows = parseCSV(txt); }
      if (!rows.length) throw new Error('Aucune donnée dans ce fichier.');
      setParsedRows(rows);
      // Stratégie de matching robuste
      // 1. Correspondance exacte lot_id
      let match = rows.find(r => r.lot_id === foundLot?.lot_id);

      // 2. Si pas de lot_id exact → scoring numérique (ligne la plus proche)
      if (!match) {
        const numFields = Object.keys(TOLERANCES).filter(f => foundLot[f] != null);
        if (numFields.length > 0) {
          const scored = rows.map(row => {
            let score = 0, count = 0;
            numFields.forEach(f => {
              if (row[f] != null && row[f] !== '') {
                const diff = Math.abs(+foundLot[f] - +row[f]);
                const tol  = TOLERANCES[f];
                // Score 2 si dans tolérance, 1 si < 3x tolérance, 0 sinon
                score += diff <= tol ? 2 : diff <= tol * 3 ? 1 : 0;
                count++;
              }
            });
            // Pénalité si tous les champs = 0 (fichier suspect)
            const allZero = numFields.every(f => row[f] == null || +row[f] === 0);
            return { row, score: allZero ? -999 : (count > 0 ? score / count : 0), count };
          });
          scored.sort((a, b) => b.score - a.score);
          // Accepter seulement si score > 0.5 (au moins quelques champs proches)
          if (scored[0].score > 0.5 && scored[0].count >= 2) {
            match = scored[0].row;
          }
        }
        // 3. Fallback : une seule ligne → la prendre directement
        if (!match && rows.length === 1) match = rows[0];
      }

      if (match) {
        setMatchedRow(match);
        const cmp = buildComparison(foundLot, match);
        setComparison(cmp);
        setStep(3); // ← Toujours step 3 même si fraude détectée
      } else if (rows.length > 1) {
        // Plusieurs lignes mais aucune ne correspond → laisser l'utilisateur choisir
        // (déjà géré par le rendu)
      }
    } catch (err) { setFileError(err.message); }
    finally { setParsing(false); }
  }, [foundLot]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const selectRow = useCallback((row) => {
    setMatchedRow(row);
    const cmp = buildComparison(foundLot, row);
    setComparison(cmp);
    setStep(3);
  }, [foundLot]);

  const handleValidate = useCallback(async (forceOk=false) => {
    if (!foundLot || !comparison) return;
    setValidating(true);
    await new Promise(r => setTimeout(r, 1000));
    const status = (comparison.allOk || forceOk) ? 'AUTHENTIQUE' : 'SUSPECT';
    updateLot(foundLot.lot_id, {
      regulator_validated:    true,
      regulator_validated_at: new Date().toISOString(),
      regulator_data:         matchedRow,
      validation_comparison:  comparison.results,
      validation_signature:   comparison.signature,
      validation_fraud_alerts:comparison.fraudAlerts || [],
      validation_forced:      forceOk && !comparison.allOk,
      status,
      // Journal d'audit
      audit_trail: [
        ...(foundLot.audit_trail || []),
        {
          event:    'REGULATOR_VALIDATION',
          status,
          at:       new Date().toISOString(),
          signature:comparison.signature,
          params_compared: comparison.results.length,
          conformes:comparison.results.filter(r=>r.ok).length,
          forced:   forceOk && !comparison.allOk,
          fraud_alerts: (comparison.fraudAlerts||[]).map(a=>a.type),
        }
      ],
    });
    notify(status === 'AUTHENTIQUE' ? NOTIF_TYPES.LOT_VALIDATED : NOTIF_TYPES.LOT_SUSPECT, {
      lotId: foundLot.lot_id,
      site:  foundLot.site,
    });
    addToast(status==='AUTHENTIQUE' ? `ok Lot ${foundLot.lot_id} validé` : `! Lot ${foundLot.lot_id} marqué SUSPECT`,
      status==='AUTHENTIQUE' ? 'success' : 'warning');
    setStep(4); setValidating(false);
  }, [foundLot, comparison, matchedRow, updateLot, addToast]);

  const reset = () => {
    setStep(1); setLotQuery(''); setFoundLot(null); setNotFound(false);
    setParsedRows([]); setMatchedRow(null); setComparison(null); setFileError('');
  };

  const pendingLots = lots.filter(l =>
    !l.regulator_validated &&
    l.analyzed_at &&
    l.status === 'AUTHENTIQUE'
  );

  const handleAutoValidate = useCallback(async (lot) => {
    if (validatingLotId) return;
    console.log('[AUTO_VALIDATE] Début validation pour:', lot.lot_id);
    setValidatingLotId(lot.lot_id);
    try {
      console.log('[AUTO_VALIDATE] Appel API...');
      let result;
      try {
        result = await apiService.autoValidateLot(lot.lot_id);
      } catch (err) {
        const errorMessage = err?.error || err?.message || '';
        if (!errorMessage.toLowerCase().includes('lot non trouv')) {
          throw err;
        }

        console.warn('[AUTO_VALIDATE] Lot absent en base, synchronisation PostgreSQL...');
        await apiService.createLot({
          lot_id: lot.lot_id,
          site: lot.site,
          extraction_date: lot.extraction_date,
          status: lot.status,
          weight_tonnes: lot.weight_tonnes ?? lot.weight,
          cu_grade_percent: lot.cu_grade_percent ?? lot.composition?.cu,
          co_grade_percent: lot.co_grade_percent ?? lot.composition?.co,
          fe_percent: lot.fe_percent ?? lot.composition?.fe,
          ni_percent: lot.ni_percent ?? lot.composition?.ni,
          s_percent: lot.s_percent ?? lot.composition?.s,
          silica_percent: lot.silica_percent ?? lot.composition?.silica,
          density_t_m3: lot.density_t_m3,
          moisture_percent: lot.moisture_percent,
          hardness_mohs: lot.hardness_mohs,
        });
        result = await apiService.autoValidateLot(lot.lot_id);
      }
      console.log('[AUTO_VALIDATE] Réponse API:', result);
      
      if (result.success) {
        console.log('[AUTO_VALIDATE] Mise à jour du lot avec status:', result.status);
        updateLot(lot.lot_id, {
          regulator_validated: true,
          regulator_validated_at: new Date().toISOString(),
          regulator_data: result.dgmr_data,
          validation_comparison: result.comparison,
          status: result.status,
          audit_trail: [
            ...(lot.audit_trail || []),
            {
              event: 'AUTO_VALIDATION',
              status: result.status,
              at: new Date().toISOString(),
              params_compared: result.comparison?.length || 0,
            }
          ],
        });
        notify(result.status === 'AUTHENTIQUE' ? NOTIF_TYPES.LOT_VALIDATED : NOTIF_TYPES.LOT_SUSPECT, {
          lotId: lot.lot_id,
          site: lot.site,
        });
        addToast(result.status === 'AUTHENTIQUE' ? `ok Lot ${lot.lot_id} validé` : `! Lot ${lot.lot_id} marqué SUSPECT`,
          result.status === 'AUTHENTIQUE' ? 'success' : 'warning');
        
        // Afficher la comparaison détaillée
        setFoundLot(lot);
        setMatchedRow(result.dgmr_data || {});
        setComparison({
          results: result.comparison,
          allOk: result.status === 'AUTHENTIQUE',
          fraudAlerts: [],
          blocked: false,
          signature: '',
          comparedAt: new Date().toISOString(),
        });
        setStep(3);
        console.log('[AUTO_VALIDATE] Validation terminée avec succès');
      } else {
        console.error('[AUTO_VALIDATE] Échec:', result.message || result.error);
        addToast(`Erreur: ${result.message || result.error || 'Validation échouée'}`, 'error');
      }
    } catch (err) {
      console.error('[AUTO_VALIDATE] Exception:', err);
      addToast(`Erreur validation: ${err.message || err.error || 'Échec'}`, 'error');
    } finally {
      console.log('[AUTO_VALIDATE] Fin');
      setValidatingLotId(null);
    }
  }, [validatingLotId, updateLot, addToast, notify]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={t('analysis.title')}
        subtitle={t('analysis.subtitle')}
        actions={step > 1 && <button className="btn btn-ghost btn-sm" onClick={reset}><Ic name="history" size={14}/> Recommencer</button>}
      />

      {/* Barre de progression */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
        {[{n:1,l:t('analysis.step1')},{n:2,l:t('analysis.step2')},{n:3,l:t('analysis.step3')},{n:4,l:t('analysis.step4')}].map((s,i,arr) => (
          <React.Fragment key={s.n}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{
                width:34, height:34, borderRadius:'50%',
                background: step>=s.n?'var(--brand)':'var(--bg-raised)',
                border:`2px solid ${step>=s.n?'var(--brand)':'var(--border-soft)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.85rem', fontWeight:700, color:step>=s.n?'#fff':'var(--text-muted)', transition:'all 0.3s',
              }}>{step>s.n?'ok':s.n}</div>
              <span style={{ fontSize:'0.67rem', whiteSpace:'nowrap', fontWeight:step===s.n?700:400, color:step>=s.n?'var(--brand)':'var(--text-muted)' }}>
                {s.l}
              </span>
            </div>
            {i<arr.length-1 && <div style={{ flex:1, height:2, margin:'0 8px', marginBottom:22, background:step>s.n?'var(--brand)':'var(--border-soft)', transition:'background 0.4s' }}/>}
          </React.Fragment>
        ))}
      </div>

      {/* ─── ÉTAPE 1 : Scanner le lot ─────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <div className="card" style={{ textAlign:'center' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:8 }}>{t('analysis.scan.title')}</h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:20 }}>Entrez le lot à valider ou cliquez directement dans la liste</p>

            {/* Zone scan */}
            <div onClick={() => lotQuery && searchLot()} style={{
              width:200, height:200, margin:'0 auto 20px',
              border:`2px solid ${scanAnim?'var(--brand)':'var(--border-active)'}`,
              borderRadius:16, position:'relative', overflow:'hidden',
              background:'var(--bg-raised)', cursor:lotQuery?'pointer':'default', transition:'border-color 0.3s',
            }}>
              {/* Coins dorés */}
              {[[8,8,'top','left'],[8,'r','top','right'],['b',8,'bottom','left'],['b','r','bottom','right']].map(([t,l,bt,bl],i)=>(
                <div key={i} style={{ position:'absolute', width:20, height:20,
                  top:t==='b'?'auto':t, bottom:t==='b'?8:'auto',
                  left:l==='r'?'auto':l, right:l==='r'?8:'auto',
                  borderTop:bt==='top'?'3px solid var(--brand)':'none',
                  borderBottom:bt==='bottom'?'3px solid var(--brand)':'none',
                  borderLeft:bl==='left'?'3px solid var(--brand)':'none',
                  borderRight:bl==='right'?'3px solid var(--brand)':'none',
                }}/>
              ))}
              {scanAnim && <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,var(--brand),transparent)', animation:'scanLine 1s linear infinite', boxShadow:'0 0 8px var(--brand)' }}/>}
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ fontSize:42, opacity:scanAnim?0.2:0.45 }}><Ic name="scale" size={14}/></span>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                  {scanAnim?'Recherche…':lotQuery?'Cliquer pour chercher':'Saisir le lot'}
                </span>
              </div>
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input className="form-input" placeholder={t('analysis.scan.placeholder')} value={lotQuery}
                onChange={e=>{ setLotQuery(e.target.value); setNotFound(false); }}
                onKeyDown={e=>e.key==='Enter'&&searchLot()} style={{ flex:1 }}/>
              <button className="btn btn-gold btn-sm" onClick={()=>searchLot()} disabled={!lotQuery.trim()||scanAnim}>
                {scanAnim ? <div className="loader" style={{ width:14, height:14, borderTopColor:'#0c0a06' }}/> : t('analysis.scan.btn')}
              </button>
            </div>
            {notFound && (
              <div style={{ padding:'10px 14px', background:'var(--crimson-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--r-md)', fontSize:'0.82rem', color:'var(--crimson)' }}>
                {t('analysis.notfound')} : «{lotQuery}»
              </div>
            )}
          </div>

          {/* Liste lots en attente */}
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', marginBottom:14 }}>
              Lots en attente de validation <span style={{ color:'var(--amber)', fontSize:'0.8rem', fontWeight:400 }}>({pendingLots.length})</span>
            </h3>
            {pendingLots.length===0 ? (
              <EmptyState icon="check" title={t('analysis.pending.empty')} subtitle={t('analysis.pending.empty_sub')}/>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto' }}>
                {pendingLots.map(lot => (
                  <div key={lot.lot_id} style={{
                    padding:'10px 14px', background:'var(--bg-raised)', border:'1px solid var(--border-dim)',
                    borderRadius:'var(--r-md)', transition:'all 0.15s',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'0.88rem', color:'var(--brand)' }}>{lot.lot_id}</span>
                      <MineralBadge type={lot.mineral_type}/><StatusBadge status={lot.status}/>
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', gap:12, marginBottom:8 }}>
                      <span>{lot.site}</span><span>Cu:{lot.cu_grade_percent??'—'}%</span><span>Co:{lot.co_grade_percent??'—'}%</span>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-gold btn-sm" onClick={()=>handleAutoValidate(lot)} disabled={validatingLotId === lot.lot_id} style={{ flex:1 }}>
                        {validatingLotId === lot.lot_id ? <div className="loader" style={{ width:12, height:12, borderTopColor:'#0c0a06' }}/> : 'Double analyse'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{ setFoundLot(lot); setLotQuery(lot.lot_id); setStep(2); }} disabled={validatingLotId !== null}>
                        <Ic name="upload" size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 2 : Import fichier ──────────────────────────────────────── */}
      {step === 2 && foundLot && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          {/* Données producteur */}
          <div className="card" style={{ border:'1px solid var(--border-active)', background:'var(--brand-dim)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'1rem', color:'var(--brand)' }}>{foundLot.lot_id}</span>
              <MineralBadge type={foundLot.mineral_type}/><StatusBadge status={foundLot.status}/>
            </div>
            <div className="label" style={{ marginBottom:10, display:'block', color:'var(--brand)' }}>{t('analysis.prod.label')}</div>
            {Object.entries(LABELS).map(([k, label]) => foundLot[k]!=null && foundLot[k]!=='' && (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-dim)' }}>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{label}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', color:'var(--brand-light)', fontWeight:600 }}>{Number(foundLot[k]).toFixed(3)}</span>
              </div>
            ))}
          </div>

          {/* Zone import */}
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', marginBottom:8 }}>{t('analysis.import.title')}</h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:18 }}>
              Importez le fichier Excel ou CSV de votre labo DGMR.
              Le lot <strong style={{ color:'var(--brand)' }}>{foundLot.lot_id}</strong> sera détecté automatiquement.
            </p>
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={onDrop}
              onClick={()=>fileRef.current?.click()}
              style={{
                border:`2px dashed ${dragOver?'var(--brand)':'var(--border-soft)'}`,
                borderRadius:'var(--r-lg)', padding:'40px 20px', textAlign:'center', cursor:'pointer',
                background:dragOver?'rgba(201,168,76,0.06)':'var(--bg-raised)', transition:'all 0.2s', marginBottom:16,
              }}>
              <div style={{ fontSize:40, marginBottom:10, opacity:0.5 }}>{null}</div>
              <div style={{ fontSize:'0.9rem', color:'var(--text-secondary)', fontWeight:600, marginBottom:6 }}>
                {parsing ? t('analysis.import.reading') : t('analysis.import.drop')}
              </div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{t('analysis.import.formats')}</div>
              {parsing && <div className="loader" style={{ width:20, height:20, margin:'10px auto 0', borderTopColor:'var(--brand)' }}/>}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }}
              onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])}/>

            {fileError && (
              <div style={{ padding:'10px 14px', background:'var(--crimson-dim)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--r-md)', fontSize:'0.82rem', color:'var(--crimson)', marginBottom:12 }}>
                x {fileError}
              </div>
            )}

            {/* Fichier chargé — afficher le nb de lignes trouvées */}
            {parsedRows.length > 0 && !matchedRow && !parsing && (
              <div style={{ padding:'10px 14px', background:'var(--amber-dim)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'var(--r-md)', fontSize:'0.82rem', color:'var(--amber)' }}>
                 {parsedRows.length} ligne(s) trouvée(s) — sélection automatique en cours…
              </div>
            )}

            {/* Confirmation chargement */}
            {matchedRow && comparison && (
              <div style={{ padding:'12px 16px', background:'var(--emerald-dim)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'var(--r-md)' }}>
                <div style={{ fontWeight:600, color:'var(--emerald)', marginBottom:6 }}>{t('analysis.import.loaded')}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:10 }}>
                  {comparison.results.length} paramètres comparés ·
                  <span style={{ color:comparison.allOk?'var(--emerald)':'var(--crimson)', fontWeight:600 }}>
                    {comparison.allOk ? ` ${t('analysis.compare.ok')}` : ` ${comparison.results.filter(r=>!r.ok).length} ${t('analysis.result.diverge', {n:''}).replace('{n}','').trim()}`}
                  </span>
                </div>
                <button className="btn btn-gold btn-sm" onClick={()=>setStep(3)}>
                  Voir la comparaison <Ic name="arrow_right" size={14}/>
                </button>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={()=>{setStep(1);setFoundLot(null);setParsedRows([]);}} style={{ marginTop:12 }}><Ic name="arrow_left" size={14}/> Retour</button>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 3 : Tableau de comparaison ─────────────────────────────── */}
      {step === 3 && comparison && foundLot && (
        <div>
          {/* Bandeau résumé + boutons */}
          <div style={{
            display:'flex', alignItems:'center', gap:16, padding:'18px 24px', marginBottom:20,
            background:comparison.allOk?'var(--emerald-dim)':'var(--crimson-dim)',
            border:`1px solid ${comparison.allOk?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`,
            borderRadius:'var(--r-md)', animation:'fadeUp 0.3s ease',
          }}>
            <span style={{ fontSize:32 }}>{comparison.allOk ? 'ok' : 'fail'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'1rem', color:comparison.allOk?'var(--emerald)':'var(--crimson)', marginBottom:4 }}>
                {comparison.blocked
                  ? t('analysis.result.blocked', { msg: comparison.fraudAlerts?.[0]?.msg || 'données insuffisantes' })
                  : comparison.allOk
                    ? t('analysis.result.conform', { id: foundLot.lot_id })
                    : t('analysis.result.diverge', { n: comparison.results.filter(r=>!r.ok).length })
                }
              </div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                {t('analysis.result.conformes', { ok: comparison.results.filter(r=>r.ok).length, total: comparison.results.length })}
                {' · '}<span style={{ fontFamily:'var(--font-mono)' }}>{foundLot.lot_id}</span>
                {' · '}{foundLot.site}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {comparison.blocked ? (
                <button className="btn btn-danger btn-sm" onClick={()=>handleValidate(false)} disabled={validating}>
                  {validating ? <div className="loader" style={{ width:14, height:14, borderTopColor:'#fff' }}/> : 'Marquer SUSPECT'}
                </button>
              ) : comparison.allOk ? (
                <button className="btn btn-gold" onClick={()=>handleValidate(false)} disabled={validating}
                  style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {validating ? <><div className="loader" style={{ width:14, height:14, borderTopColor:'#0c0a06' }}/> {t('analysis.validate.loading')}</> : t('analysis.validate.btn')}
                </button>
              ) : (
                <>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleValidate(false)} disabled={validating}>Marquer SUSPECT</button>
                  <button className="btn btn-ghost btn-sm" disabled={validating}
                    onClick={()=>{if(window.confirm(t('analysis.validate.force') + ' ' + foundLot.lot_id + ' ?'))handleValidate(true);}}>
                    Forcer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tableau */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{
              display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 70px 28px',
              gap:'0 10px', padding:'10px 16px',
              background:'var(--bg-raised)', borderBottom:'1px solid var(--border-soft)',
            }}>
              {[t('analysis.compare.title'),t('analysis.compare.producer'),t('analysis.compare.regulator'),t('analysis.compare.gap'),t('analysis.compare.tolerance'),t('analysis.compare.ok')].map((h,i) => (
                <span key={h} style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em',
                  color:i===1?'var(--brand-light)':i===2?'var(--emerald)':'var(--text-muted)',
                  textAlign:i===0?'left':'center'
                }}>{h}</span>
              ))}
            </div>
            {/* Alertes fraude / blocage */}
            {comparison.fraudAlerts?.length > 0 && (
              <div style={{ padding:'16px 20px', background:'var(--crimson-dim)', borderBottom:'1px solid rgba(239,68,68,0.2)' }}>
                {comparison.fraudAlerts.map((a,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom: i < comparison.fraudAlerts.length-1 ? 8 : 0 }}>
                    <span style={{ color:'var(--crimson)', fontWeight:700, flexShrink:0 }}><Ic name="block" size={14}/></span>
                    <div>
                      <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--crimson)', display:'block' }}>{a.type}</span>
                      <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{a.msg}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {comparison.results.length > 0
              ? comparison.results.map(item => <CompareRow key={item.field} item={item}/>)
              : !comparison.fraudAlerts?.length && (
                <div style={{ padding:'24px', textAlign:'center', color:'var(--text-muted)', fontSize:'0.85rem' }}>
                  {t('analysis.compare.no_common')}
                </div>
              )
            }
          </div>

          <div style={{ display:'flex', gap:10, marginTop:14, alignItems:'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setStep(2)}><Ic name="arrow_left" size={14}/> Changer le fichier</button>
            <span style={{ flex:1 }}/>
            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontStyle:'italic' }}>Normes CEEC/DGMR</span>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 4 : Résultat ───────────────────────────────────────────── */}
      {step === 4 && foundLot && (
        <div style={{ maxWidth:520, margin:'0 auto', textAlign:'center', animation:'fadeUp 0.4s ease' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>{comparison?.allOk ? 'ok' : 'warn'}</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', marginBottom:8, color:comparison?.allOk?'var(--emerald)':'var(--amber)' }}>
            {comparison?.allOk ? t('analysis.done.validated') : t('analysis.done.suspect')}
          </h2>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'1rem', color:'var(--brand)', marginBottom:20 }}>{foundLot.lot_id}</div>
          <div style={{ padding:'16px 24px', background:'var(--bg-raised)', borderRadius:'var(--r-md)', border:'1px solid var(--border-dim)', marginBottom:24, textAlign:'left' }}>
            <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:6 }}>
              {comparison?.results.length} paramètres comparés · {comparison?.allOk ? t('analysis.compare.norms') : `${comparison?.results.filter(r=>!r.ok).length} divergence(s)`}
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginBottom:8 }}>
              {fmt.datetime(new Date().toISOString())} · DGMR
            </div>
            <div style={{ fontSize:'0.78rem', color:comparison?.allOk?'var(--emerald)':'var(--crimson)', fontWeight:600 }}>
              {comparison?.allOk ? t('analysis.done.unlock') : t('analysis.done.block')}
            </div>
          </div>
          <button className="btn btn-outline" onClick={reset}>{t('analysis.done.new')}</button>
        </div>
      )}
    </div>
  );
}
