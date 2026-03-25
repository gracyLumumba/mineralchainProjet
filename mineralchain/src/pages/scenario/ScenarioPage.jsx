import React, { useState } from 'react';
import { useI18n } from '../../contexts/i18nContext';
import { useApp } from '../../contexts/AppContext';
import { StatusBadge, MineralBadge } from '../../components/common/UI';
import { Ic } from '../../components/common/Icons';

const STEPS = [
  {
    id: 1, actor: 'admin', icon: 'shield', color: '#6d28d9',
    titleFr: "Inscription & Approbation",
    titleEn: "Registration & Approval",
    descFr: "Les acteurs soumettent leur demande d'accès avec leur rôle et organisation. L'administrateur système examine chaque dossier et approuve ou refuse l'accès.",
    descEn: "Actors submit their access request with their role and organization. The system administrator reviews each application and approves or denies access.",
    details: [
      { actor:'Producteur KAMOA', action:'Soumet une demande avec : Nom, Organisation, Site minier, Rôle', icon:'mine' },
      { actor:'Régulateur DGMR',  action:'Soumet sa demande officielle avec numéro de badge DGMR',       icon:'scale' },
      { actor:'Transporteur',     action:'Soumet sa demande avec licence de transport et compagnie',      icon:'truck' },
      { actor:'Administrateur',   action:'Examine, approuve ou refuse chaque demande avec motif',        icon:'shield' },
    ],
    security: "Aucun accès au système sans approbation explicite de l'administrateur.",
    status: 'done',
  },
  {
    id: 2, actor: 'producer', icon: 'mine', color: '#b87333',
    titleFr: "Extraction & Soumission du lot",
    titleEn: "Mining & Lot Submission",
    descFr: "Le producteur extrait le minerai, effectue ses analyses en laboratoire interne, puis soumet les données physico-chimiques du lot sur MineralChain.",
    descEn: "The producer mines the ore, performs internal laboratory analysis, then submits the physicochemical data of the lot on MineralChain.",
    details: [
      { actor:'Producteur', action:'Extrait le minerai sur site KAMOA ou KCC',                           icon:'mine' },
      { actor:'Producteur', action:'Analyse interne : Cu, Co, Fe, densité, humidité, poids…',           icon:'lab' },
      { actor:'Producteur', action:'Soumet le lot (10 variables) sur MineralChain via le formulaire',   icon:'pen' },
      { actor:'IA',         action:'Analyse automatique : type, impureté, détection fraude (3 modèles)',icon:'robot' },
    ],
    security: "L'IA applique 7 règles heuristiques géologiques pour détecter les anomalies évidentes.",
    status: 'done',
  },
  {
    id: 3, actor: 'regulator', icon: 'scale', color: '#2563eb',
    titleFr: "Double Analyse Indépendante",
    titleEn: "Independent Dual Analysis",
    descFr: "Le régulateur DGMR prélève ses propres échantillons sur le même site, les fait analyser dans son laboratoire indépendant, puis importe les résultats sur MineralChain pour comparaison.",
    descEn: "The DGMR regulator takes their own samples from the same site, has them analyzed in their independent laboratory, then imports the results to MineralChain for comparison.",
    details: [
      { actor:'Régulateur DGMR', action:'Prélève ses propres échantillons sur le même site', icon:'factory' },
      { actor:'Labo DGMR',       action:'Analyse indépendante des mêmes paramètres',         icon:'lab' },
      { actor:'Régulateur DGMR', action:'Importe le fichier Excel/CSV de résultats labo',    icon:'' },
      { actor:'Système',         action:'Comparaison automatique champ par champ (tolérances CEEC/DGMR)',icon:'scale' },
    ],
    security: "Score de proximité automatique — le régulateur ne saisit rien manuellement pour éviter la corruption.",
    status: 'done',
  },
  {
    id: 4, actor: 'regulator', icon: 'check', color: '#047857',
    titleFr: "Validation & Certification NFT",
    titleEn: "Validation & NFT Certification",
    descFr: "Si les deux analyses sont cohérentes (dans les tolérances CEEC/DGMR), le régulateur valide le lot. Le système minte un token NFT ERC-721 immuable sur la blockchain Ethereum.",
    descEn: "If both analyses are consistent (within CEEC/DGMR tolerances), the regulator validates the lot. The system mints an immutable ERC-721 NFT token on the Ethereum blockchain.",
    details: [
      { actor:'Régulateur', action:'Valide le lot si cohérence confirmée (ou marque SUSPECT)',   icon:'scale' },
      { actor:'Blockchain', action:'Mint NFT ERC-721 : token unique, immuable, vérifiable',      icon:'certificate' },
      { actor:'IPFS',       action:'Certificat JSON v2.0 épinglé sur Pinata (hash permanent)',   icon:'cloud' },
      { actor:'Système',    action:'Transport débloqué — transporteur peut voir le lot',          icon:'unlock' },
    ],
    security: "Sans validation régulateur : NFT non minté, transport bloqué, lot invisible au transporteur.",
    status: 'done',
  },
  {
    id: 5, actor: 'transporter', icon: 'truck', color: '#047857',
    titleFr: "Transport & Traçabilité",
    titleEn: "Transport & Traceability",
    descFr: "Le transporteur prend en charge le lot certifié, scanne le certificat NFT pour vérification, démarre le transport et confirme la livraison à l'usine de traitement.",
    descEn: "The transporter takes charge of the certified lot, scans the NFT certificate for verification, starts transport and confirms delivery to the processing plant.",
    details: [
      { actor:'Transporteur', action:'Voit les lots validés par le régulateur dans son interface', icon:'clipboard' },
      { actor:'Transporteur', action:'Scanne le QR code du certificat (pointe vers IPFS)',         icon:'camera' },
      { actor:'Transporteur', action:'Démarre le transport avec destination déclarée',             icon:'truck' },
      { actor:'Transporteur', action:'Confirme la livraison à l\'usine, blockchain mise à jour', icon:'factory' },
    ],
    security: "Chaque étape (départ, livraison) est enregistrée dans le journal d'audit immuable.",
    status: 'done',
  },
  {
    id: 6, actor: 'buyer', icon: 'globe', color: '#374151',
    titleFr: "Vérification Internationale",
    titleEn: "International Verification",
    descFr: "L'acheteur étranger ou l'auditeur de conformité scanne le QR code sur le document d'expédition. Le certificat s'ouvre depuis IPFS et la signature blockchain est vérifiable en quelques secondes.",
    descEn: "The foreign buyer or compliance auditor scans the QR code on the shipping document. The certificate opens from IPFS and the blockchain signature is verifiable in seconds.",
    details: [
      { actor:'Acheteur',  action:'Scanne le QR code sur le document d\'expédition', icon:'camera' },
      { actor:'IPFS',      action:'Certificat JSON s\'ouvre depuis la gateway Pinata', icon:'globe' },
      { actor:'Blockchain','action':'Hash vérifié : production site + analyse IA + validation DGMR + transport', icon:'lock' },
      { actor:'Conformité',action:'Preuve cryptographique pour réglementation EU / Dodd-Frank', icon:'check' },
    ],
    security: "Vérification sans intermédiaire, sans serveur central, infalsifiable.",
    status: 'done',
  },
];

const ACTOR_COLORS = {
  admin: '#6d28d9', producer: '#b87333', regulator: '#2563eb',
  transporter: '#047857', buyer: '#374151',
};

function StepCard({ step, isActive, onClick, lang }) {
  const title = lang === 'fr' ? step.titleFr : step.titleEn;
  const desc  = lang === 'fr' ? step.descFr  : step.descEn;
  const c     = ACTOR_COLORS[step.actor] || '#374151';

  return (
    <button
      onClick={onClick}
      style={{
        width:'100%', textAlign:'left', padding:'16px 18px', cursor:'pointer',
        background: isActive ? `${c}12` : 'var(--bg-raised)',
        border:`1.5px solid ${isActive ? c : 'var(--border-soft)'}`,
        borderRadius:12,
        boxShadow: isActive ? `0 0 0 3px ${c}20` : 'none',
        transition:'all 0.2s',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:`${c}18`, border:`2px solid ${c}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
          {step.icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'0.7rem', color:c, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>
            Étape {step.id}
          </div>
          <div style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--text-primary)', lineHeight:1.3 }}>
            {title}
          </div>
        </div>
        <div style={{ fontSize:16, color:isActive?c:'var(--text-muted)' }}>
          <Ic name="chevron_right" size={14}/>
        </div>
      </div>
      {isActive && (
        <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', lineHeight:1.6, marginTop:4, paddingLeft:42 }}>
          {desc}
        </div>
      )}
    </button>
  );
}

function DetailPanel({ step, lang }) {
  const title = lang === 'fr' ? step.titleFr : step.titleEn;
  const desc  = lang === 'fr' ? step.descFr  : step.descEn;
  const c     = ACTOR_COLORS[step.actor] || '#374151';

  return (
    <div style={{ background:'var(--bg-raised)', borderRadius:16, padding:'28px 28px', border:'1px solid var(--border-soft)', height:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:`${c}15`, border:`2px solid ${c}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
          {step.icon}
        </div>
        <div>
          <div style={{ fontSize:'0.72rem', color:c, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Étape {step.id} / {STEPS.length}
          </div>
          <h2 style={{ fontSize:'1.3rem', fontWeight:700, color:'var(--text-primary)', margin:0, fontFamily:'var(--font-display)' }}>
            {title}
          </h2>
        </div>
      </div>

      <p style={{ fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.7, marginBottom:24 }}>
        {desc}
      </p>

      {/* Détail des actions */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:12 }}>
          Déroulement
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {step.details.map((d, i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', background:'var(--bg-surface)', borderRadius:10, border:'1px solid var(--border-dim)' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`${c}12`, border:`1px solid ${c}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
                {d.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:c, marginBottom:2 }}>{d.actor}</div>
                <div style={{ fontSize:'0.83rem', color:'var(--text-primary)' }}>{d.action}</div>
              </div>
              <div style={{ width:22, height:22, borderRadius:'50%', background:`${c}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:c, flexShrink:0 }}>
                {i+1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sécurité */}
      <div style={{ padding:'14px 16px', background:'rgba(4,120,87,0.08)', border:'1px solid rgba(4,120,87,0.2)', borderRadius:10 }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#047857', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
           Garantie de sécurité
        </div>
        <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.6 }}>
          {step.security}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function ScenarioPage() {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(1);
  const [lang, setLang]             = useState('fr');
  const current = STEPS.find(s => s.id === activeStep) || STEPS[0];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', color:'var(--text-primary)', marginBottom:6 }}>
               Scénario bout-en-bout
            </h1>
            <p style={{ fontSize:'0.9rem', color:'var(--text-secondary)', maxWidth:600 }}>
              {lang === 'fr'
                ? 'Flux complet de certification d\'un lot minier : de l\'extraction au marché international, avec contrôles IA, blockchain et régulateur DGMR.'
                : 'Complete certification flow of a mineral lot: from extraction to international market, with AI, blockchain and DGMR regulator controls.'}
            </p>
          </div>
          <div style={{ display:'flex', gap:4, background:'var(--bg-hover)', borderRadius:8, padding:3 }}>
            {['fr','en'].map(l => (
              <button key={l} onClick={()=>setLang(l)} style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', background:lang===l?'var(--gold)':'transparent', color:lang===l?'#fff':'var(--text-muted)', fontWeight:lang===l?700:400, fontSize:'0.82rem', fontFamily:'var(--font-body)' }}>
                {l === 'fr' ? 'FR' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Barre de progression */}
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {STEPS.map((s, i) => {
            const c = ACTOR_COLORS[s.actor] || '#374151';
            const isActive = s.id === activeStep;
            const isPast   = s.id < activeStep;
            return (
              <React.Fragment key={s.id}>
                <button onClick={()=>setActiveStep(s.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'4px 2px' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background: isPast?c:isActive?`${c}20`:'var(--bg-raised)', border:`2px solid ${isActive||isPast?c:'var(--border-soft)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:isPast?'#fff':isActive?c:'var(--text-muted)', fontWeight:700, transition:'all 0.2s' }}>
                    {isPast ? 'ok' : s.id}
                  </div>
                  <span style={{ fontSize:'0.6rem', color:isActive?c:'var(--text-muted)', fontWeight:isActive?700:400, whiteSpace:'nowrap', maxWidth:64, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {lang==='fr' ? s.titleFr.split(' ').slice(0,2).join(' ') : s.titleEn.split(' ').slice(0,2).join(' ')}
                  </span>
                </button>
                {i < STEPS.length-1 && (
                  <div style={{ flex:1, height:2, margin:'0 4px', marginBottom:20, background:s.id < activeStep ? ACTOR_COLORS[s.actor] : 'var(--border-soft)', transition:'background 0.3s' }}/>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Contenu : liste gauche + détail droite */}
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {STEPS.map(s => (
            <StepCard key={s.id} step={s} isActive={s.id===activeStep} onClick={()=>setActiveStep(s.id)} lang={lang}/>
          ))}

          {/* Nav buttons */}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center' }}
              disabled={activeStep===1} onClick={()=>setActiveStep(p=>p-1)}><Ic name="arrow_left" size={14}/> Précédent</button>
            <button className="btn btn-gold btn-sm" style={{ flex:1, justifyContent:'center' }}
              disabled={activeStep===STEPS.length} onClick={()=>setActiveStep(p=>p+1)}>Suivant <Ic name="arrow_right" size={14}/></button>
          </div>
        </div>

        <DetailPanel step={current} lang={lang}/>
      </div>

      {/* Résumé architecture */}
      <div style={{ marginTop:28, padding:'20px 24px', background:'var(--bg-raised)', borderRadius:16, border:'1px solid var(--border-soft)' }}>
        <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:16, color:'var(--text-primary)' }}>
           Architecture du système — séparation des rôles
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { role:'Administrateur', color:'#6d28d9', perms:['Approuver les comptes', 'Gérer les accès', 'Superviser le système'] },
            { role:'Producteur',      color:'#b87333', perms:['Soumettre des lots', 'Voir ses propres lots', 'Télécharger certificats'] },
            { role:'Régulateur DGMR', color:'#2563eb', perms:['Double analyse labo', 'Valider / Rejeter lots', 'Émettre alertes fraude'] },
            { role:'Transporteur',    color:'#047857', perms:['Transport lots certifiés', 'Scanner QR certificats', 'Confirmer livraisons'] },
          ].map(r => (
            <div key={r.role} style={{ padding:'14px 16px', background:'var(--bg-surface)', borderRadius:10, border:'1px solid var(--border-dim)' }}>
              <div style={{ fontSize:'0.88rem', fontWeight:700, color:r.color, marginBottom:10 }}>{r.role}</div>
              {r.perms.map(p => (
                <div key={p} style={{ display:'flex', gap:6, alignItems:'flex-start', marginBottom:5, fontSize:'0.75rem', color:'var(--text-secondary)' }}>
                  <span style={{ color:r.color, flexShrink:0, marginTop:1 }}><Ic name="chevron_right" size={12}/></span>
                  {p}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
