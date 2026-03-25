import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

//  localStorage helpers 
const LS = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (error) { void error; return fallback; }
  },
  set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { void error; } },
};

function stableTokenId(seed) {
  const text = String(seed || 'mineralchain');
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(31, hash) + text.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 900000) + 1000;
}

function normalizeStoredLots(items = []) {
  return items.map((lot) => {
    if (lot?.token_id !== 0) return lot;
    return {
      ...lot,
      token_id: stableTokenId(lot.lot_id || lot.tx_hash || lot.created_at),
    };
  });
}

function normalizeStoredTokens(items = []) {
  return items.map((token) => {
    if (token?.token_id !== 0) return token;
    return {
      ...token,
      token_id: stableTokenId(token.lot_id || token.tx_hash || token.timestamp),
    };
  });
}

function normalizeTokenValue(tokenId, seed) {
  if (tokenId == null) return null;
  if (Number(tokenId) !== 0) return tokenId;
  return stableTokenId(seed);
}

//  Context 
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Persistance localStorage — survie au F5
  const [profile, setProfileState] = useState(() => LS.get('mc_profile', 'producer'));
  const [lots,    setLots]         = useState(() => normalizeStoredLots(LS.get('mc_lots', [])));
  const [tokens,  setTokens]       = useState(() => normalizeStoredTokens(LS.get('mc_tokens', [])));
  const [toasts,  setToasts]       = useState([]);
  const [apiStatus, setApiStatus]  = useState('unknown');

  // Sync localStorage à chaque changement
  useEffect(() => { LS.set('mc_lots',    lots);    }, [lots]);
  useEffect(() => { LS.set('mc_tokens',  tokens);  }, [tokens]);
  useEffect(() => { LS.set('mc_profile', profile); }, [profile]);

  //  Profil 
  const setProfile = useCallback((p) => { setProfileState(p); }, []);

  //  Toast system 
  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  //  Lot management 
  //  Audit trail helper 
  const auditEntry = (event, extra = {}) => ({
    event,
    at: new Date().toISOString(),
    ...extra,
  });

  const addLot = useCallback((lot) => {
    const secured = {
      ...lot,
      token_id: normalizeTokenValue(lot.token_id, lot.lot_id || lot.tx_hash || lot.created_at),
      // Horodatage d'intégrité
      created_at:     lot.created_at || new Date().toISOString(),
      integrity_hash: btoa(JSON.stringify({
        lot_id:   lot.lot_id,
        site:     lot.site,
        cu:       lot.cu_grade_percent,
        co:       lot.co_grade_percent,
        ts:       Date.now(),
      })).slice(0, 24),
      // Journal d'audit initial
      audit_trail: [
        { event:'LOT_CREATED', at: new Date().toISOString(),
          site: lot.site, mineral_type: lot.mineral_type,
          status: lot.status, ia_confidence: lot.confidence },
        ...(lot.token_id != null ? [{ event:'NFT_MINTED', at: new Date().toISOString(), token_id: lot.token_id, tx_hash: lot.tx_hash }] : []),
      ],
    };
    setLots(prev => {
      const updated = [secured, ...prev];
      LS.set('mc_lots', updated);
      return updated;
    });
  }, []);

  const updateLot = useCallback((lotId, updates) => {
    setLots(prev => {
      const updated = prev.map(l => {
        if (l.lot_id !== lotId) return l;

        // Détecter quel événement s'est produit
        let newEntry = null;
        if (updates.regulator_validated && !l.regulator_validated) {
          newEntry = { event:'REGULATOR_VALIDATED', at: new Date().toISOString(),
            status: updates.status, forced: updates.validation_forced || false,
            signature: updates.validation_signature || null,
            fraud_alerts: (updates.validation_fraud_alerts||[]).map(a=>a.type) };
        } else if (updates.transport_status === 'en_route' && l.transport_status !== 'en_route') {
          newEntry = { event:'TRANSPORT_STARTED', at: new Date().toISOString(), destination: updates.destination };
        } else if (updates.transport_status === 'delivered' && l.transport_status !== 'delivered') {
          newEntry = { event:'DELIVERED', at: new Date().toISOString(), destination: l.destination };
        } else if (updates.status === 'SUSPECT' && l.status !== 'SUSPECT') {
          newEntry = { event:'MARKED_SUSPECT', at: new Date().toISOString() };
        } else if (updates.ipfs_hash && !l.ipfs_hash) {
          newEntry = { event:'IPFS_PINNED', at: new Date().toISOString(), ipfs_hash: updates.ipfs_hash };
        }

        const merged = {
          ...l,
          ...updates,
          token_id: normalizeTokenValue(updates.token_id ?? l.token_id, l.lot_id || l.tx_hash || l.created_at),
        };
        if (newEntry) {
          merged.audit_trail = [...(l.audit_trail || []), newEntry];
        }
        return merged;
      });
      LS.set('mc_lots', updated);
      return updated;
    });
  }, []);

  const deleteLot = useCallback((lotId) => {
    setLots(prev => {
      const updated = prev.filter(l => l.lot_id !== lotId);
      LS.set('mc_lots', updated);
      return updated;
    });
  }, []);

  //  Token management 
  const addToken = useCallback((token) => {
    setTokens(prev => {
      const normalizedToken = {
        ...token,
        token_id: normalizeTokenValue(token.token_id, token.lot_id || token.tx_hash || token.timestamp),
      };
      const updated = [normalizedToken, ...prev];
      LS.set('mc_tokens', updated);
      return updated;
    });
  }, []);

  //  Clear all data (reset) 
  const clearData = useCallback(() => {
    setLots([]);
    setTokens([]);
    LS.set('mc_lots',   []);
    LS.set('mc_tokens', []);
  }, []);

  //  Stats computed 
  const stats = {
    total_lots:      lots.length,
    total_tokens:    tokens.length,
    auth_rate:       lots.length === 0 ? 0 : ((lots.filter(l => l.status === 'AUTHENTIQUE').length / lots.length) * 100).toFixed(1),
    suspect_count:   lots.filter(l => l.status === 'SUSPECT').length,
    certified_count: lots.filter(l => l.token_id != null).length,
    copper_count:    lots.filter(l => l.mineral_type === 'copper').length,
    cobalt_count:    lots.filter(l => l.mineral_type === 'cobalt').length,
    mixed_count:     lots.filter(l => l.mineral_type === 'mixed').length,
    in_transport:         lots.filter(l => l.transport_status === 'en_route').length,
    pending_validation:   lots.filter(l => l.analyzed_at && !l.regulator_validated && l.status !== 'SUSPECT').length,
    regulator_validated:  lots.filter(l => l.regulator_validated).length,
  };

  return (
    <AppContext.Provider value={{
      profile, setProfile,
      lots, addLot, updateLot, deleteLot,
      tokens, addToken,
      toasts, addToast, removeToast,
      apiStatus, setApiStatus,
      stats, clearData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

//  Constants 
export const PROFILES = {
  producer:    { label: 'Producteur',   icon: 'P', color: '#c9a84c',  desc: 'Mines' },
  regulator:   { label: 'Régulateur',   icon: 'R', color: '#3a7bd5',  desc: 'DGMR · CAMI · CEEC' },
  transporter: { label: 'Transporteur', icon: 'T', color: '#10b981',  desc: 'Logistique & Transit' },
  admin:       { label: 'Admin',        icon: 'A', color: '#6d3fa0',  desc: 'Administration' },
};

export const STATUS_CONFIG = {
  AUTHENTIQUE:   { icon: 'check', cls: 'badge-authentique', dot: 'dot-success' },
  SUSPECT:       { icon: 'alert', cls: 'badge-suspect',     dot: 'dot-danger'  },
  'À VÉRIFIER':  { icon: 'tip', cls: 'badge-verifie',     dot: 'dot-warning' },
};

export const MINERAL_CONFIG = {
  copper: { icon: 'gem', cls: 'badge-copper', color: '#b87333' },
  cobalt: { icon: 'activity', cls: 'badge-cobalt', color: '#3a7bd5' },
  mixed:  { icon: 'gem', cls: 'badge-mixed',  color: '#8b5cf6' },
};

//  Formatters 
export const fmt = {
  date: (d, locale = 'fr-FR') => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (error) { void error; return '?'; }
  },
  datetime: (d, locale = 'fr-FR') => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  },
  ts: (ts, locale = 'fr-FR') => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  hash:       (h, n = 8) => h ? `${h.slice(0, n + 2)}...${h.slice(-n)}` : '—',
  pct:        (v, d = 2) => v != null ? `${Number(v).toFixed(d)}%` : '—',
  confidence: (v) => { const n = v > 1 ? v : v * 100; return `${n.toFixed(1)}%`; },
  num:        (v) => v != null ? Number(v).toLocaleString('fr-FR') : '—',
};


