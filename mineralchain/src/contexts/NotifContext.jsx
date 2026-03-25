import React, {
  createContext, useContext, useState, useCallback,
  useEffect, useRef,
} from 'react';
import { useAuth } from './AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES DE NOTIFICATIONS — par rôle et événement métier
// ─────────────────────────────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  // Producteur
  LOT_ANALYZED:         'lot_analyzed',
  LOT_VALIDATED:        'lot_validated',
  LOT_SUSPECT:          'lot_suspect',
  NFT_MINTED:           'nft_minted',
  IPFS_PINNED:          'ipfs_pinned',
  LOT_DELIVERED:        'lot_delivered',
  // Régulateur
  LOT_PENDING_REVIEW:   'lot_pending_review',
  FRAUD_DETECTED:       'fraud_detected',
  VALIDATION_REQUIRED:  'validation_required',
  // Transporteur
  LOT_READY_TRANSPORT:  'lot_ready_transport',
  TRANSPORT_STARTED:    'transport_started',
  DELIVERY_CONFIRMED:   'delivery_confirmed',
  // Admin
  USER_PENDING:         'user_pending',
  USER_APPROVED:        'user_approved',
  USER_REJECTED:        'user_rejected',
  // Système
  BLOCKCHAIN_TX:        'blockchain_tx',
  SYSTEM_ALERT:         'system_alert',
  IPFS_ERROR:           'ipfs_error',
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG D'AFFICHAGE PAR TYPE
// ─────────────────────────────────────────────────────────────────────────────
export const NOTIF_CONFIG = {
  [NOTIF_TYPES.LOT_ANALYZED]:       { icon: 'robot',    color: '#2563eb', category: 'lot',        priority: 1 },
  [NOTIF_TYPES.LOT_VALIDATED]:      { icon: 'check',    color: '#047857', category: 'validation', priority: 2 },
  [NOTIF_TYPES.LOT_SUSPECT]:        { icon: 'alert',    color: '#dc2626', category: 'alert',      priority: 3 },
  [NOTIF_TYPES.NFT_MINTED]:         { icon: 'gem',      color: '#b8860b', category: 'blockchain', priority: 2 },
  [NOTIF_TYPES.IPFS_PINNED]:        { icon: 'cloud',    color: '#6d3fa0', category: 'ipfs',       priority: 1 },
  [NOTIF_TYPES.LOT_DELIVERED]:      { icon: 'factory',  color: '#047857', category: 'transport',  priority: 2 },
  [NOTIF_TYPES.LOT_PENDING_REVIEW]: { icon: 'clock',    color: '#b45309', category: 'action',     priority: 3 },
  [NOTIF_TYPES.FRAUD_DETECTED]:     { icon: 'shield',   color: '#dc2626', category: 'alert',      priority: 3 },
  [NOTIF_TYPES.VALIDATION_REQUIRED]:{ icon: 'scale',    color: '#b45309', category: 'action',     priority: 3 },
  [NOTIF_TYPES.LOT_READY_TRANSPORT]:{ icon: 'package',  color: '#047857', category: 'action',     priority: 3 },
  [NOTIF_TYPES.TRANSPORT_STARTED]:  { icon: 'truck',    color: '#2563eb', category: 'transport',  priority: 2 },
  [NOTIF_TYPES.DELIVERY_CONFIRMED]: { icon: 'delivery', color: '#047857', category: 'transport',  priority: 2 },
  [NOTIF_TYPES.USER_PENDING]:       { icon: 'users',    color: '#b45309', category: 'admin',      priority: 3 },
  [NOTIF_TYPES.USER_APPROVED]:      { icon: 'check',    color: '#047857', category: 'admin',      priority: 2 },
  [NOTIF_TYPES.USER_REJECTED]:      { icon: 'x',        color: '#dc2626', category: 'admin',      priority: 2 },
  [NOTIF_TYPES.BLOCKCHAIN_TX]:      { icon: 'chain',    color: '#b8860b', category: 'blockchain', priority: 1 },
  [NOTIF_TYPES.SYSTEM_ALERT]:       { icon: 'alert',    color: '#dc2626', category: 'system',     priority: 3 },
  [NOTIF_TYPES.IPFS_ERROR]:         { icon: 'cloud',    color: '#b45309', category: 'ipfs',       priority: 2 },
};

// ─────────────────────────────────────────────────────────────────────────────
//  STORAGE (localStorage)
// ─────────────────────────────────────────────────────────────────────────────
const LS_KEY = 'mc_notifications';
const MAX_STORED = 50; // max notifications persistées

function loadNotifs(userId) {
  try {
    const raw = localStorage.getItem(`${LS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (error) { void error; return []; }
}
function saveNotifs(userId, notifs) {
  try {
    localStorage.setItem(`${LS_KEY}_${userId}`, JSON.stringify(notifs.slice(0, MAX_STORED)));
  } catch (error) {
    return void error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const NotifContext = createContext(null);

export function NotifProvider({ children }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  // Toasts éphémères (UI en haut à droite)
  const [toasts,   setToasts]   = useState([]);
  // Centre de notifications (persisté par user)
  const [notifs,   setNotifs]   = useState([]);
  // Panel ouvert ou non
  const [panelOpen,setPanelOpen] = useState(false);

  const toastTimers = useRef({});

  // Charger les notifications au login
  useEffect(() => {
    if (userId) {
      setNotifs(loadNotifs(userId));
    } else {
      setNotifs([]);
    }
  }, [userId]);

  // Persister à chaque changement
  useEffect(() => {
    if (userId && notifs.length > 0) {
      saveNotifs(userId, notifs);
    }
  }, [notifs, userId]);

  // ── Créer un toast éphémère (type mobile push) ────────────────────────
  const showToast = useCallback((msg, type = 'success', duration = 4500) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    setToasts(prev => [{ id, msg, type, ts: Date.now() }, ...prev].slice(0, 5));

    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete toastTimers.current[id];
    }, duration);
    toastTimers.current[id] = timer;

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    clearTimeout(toastTimers.current[id]);
    delete toastTimers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Créer une notification persistée dans le centre ───────────────────
  const pushNotif = useCallback((opts) => {
    if (!userId) return;
    const {
      type = NOTIF_TYPES.SYSTEM_ALERT,
      title,
      body,
      lotId,
      data = {},
      showToast: withToast = true,
    } = opts;

    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const cfg = NOTIF_CONFIG[type] || NOTIF_CONFIG[NOTIF_TYPES.SYSTEM_ALERT];

    const notif = {
      id,
      type,
      title,
      body,
      lotId,
      data,
      icon:      cfg.icon,
      color:     cfg.color,
      category:  cfg.category,
      priority:  cfg.priority,
      read:      false,
      ts:        Date.now(),
    };

    setNotifs(prev => [notif, ...prev].slice(0, MAX_STORED));

    // Toast simultané (comme notification push téléphone)
    if (withToast) {
      const toastType = cfg.priority === 3 ? 'error'
        : cfg.category === 'blockchain' || cfg.category === 'ipfs' ? 'info'
        : cfg.category === 'validation' || cfg.category === 'transport' ? 'success'
        : 'info';
      showToast(title, toastType);
    }

    // Notification navigateur (Web Notification API)
    _tryBrowserNotif(title, body);

    return id;
  }, [userId, showToast]);

  // ── Raccourcis sémantiques par événement métier ───────────────────────
  const notify = useCallback((event, payload = {}) => {
    const { lotId, tokenId, destination, userName, txHash } = payload;

    const templates = {
      // Producteur
      [NOTIF_TYPES.LOT_ANALYZED]: {
        title: `Analyse IA terminée — ${lotId}`,
        body:  `Confiance: ${Math.round((payload.confidence||0)*100)}% · Statut: ${payload.status}`,
        type:  NOTIF_TYPES.LOT_ANALYZED,
      },
      [NOTIF_TYPES.LOT_VALIDATED]: {
        title: `Lot validé par le régulateur DGMR`,
        body:  `${lotId} est maintenant AUTHENTIQUE. Le transport est débloqué.`,
        type:  NOTIF_TYPES.LOT_VALIDATED,
      },
      [NOTIF_TYPES.LOT_SUSPECT]: {
        title: `Lot marqué SUSPECT`,
        body:  `${lotId} a été signalé par le régulateur DGMR. Transport bloqué.`,
        type:  NOTIF_TYPES.LOT_SUSPECT,
      },
      [NOTIF_TYPES.NFT_MINTED]: {
        title: `NFT #${tokenId} minté sur la blockchain`,
        body:  `${lotId} — TX: ${txHash?.slice(0,16)}…`,
        type:  NOTIF_TYPES.NFT_MINTED,
      },
      [NOTIF_TYPES.IPFS_PINNED]: {
        title: `Certificat épinglé sur IPFS`,
        body:  `${lotId} — Hash: ${(payload.ipfsHash||'').slice(0,16)}…`,
        type:  NOTIF_TYPES.IPFS_PINNED,
      },
      [NOTIF_TYPES.LOT_DELIVERED]: {
        title: `Lot livré à destination`,
        body:  `${lotId} → ${destination}`,
        type:  NOTIF_TYPES.LOT_DELIVERED,
      },
      // Régulateur
      [NOTIF_TYPES.LOT_PENDING_REVIEW]: {
        title: `Nouveau lot en attente de validation`,
        body:  `${lotId} (${payload.site}) — Action requise`,
        type:  NOTIF_TYPES.LOT_PENDING_REVIEW,
      },
      [NOTIF_TYPES.FRAUD_DETECTED]: {
        title: `Fraude détectée — ${lotId}`,
        body:  payload.fraudType || 'Valeurs suspectes détectées par l\'IA',
        type:  NOTIF_TYPES.FRAUD_DETECTED,
      },
      [NOTIF_TYPES.VALIDATION_REQUIRED]: {
        title: `${payload.count} lot${payload.count>1?'s':''} à valider`,
        body:  `Le transport est bloqué en attendant votre validation DGMR.`,
        type:  NOTIF_TYPES.VALIDATION_REQUIRED,
      },
      // Transporteur
      [NOTIF_TYPES.LOT_READY_TRANSPORT]: {
        title: `Lot certifié prêt pour transport`,
        body:  `${lotId} — Validé DGMR · NFT #${tokenId}`,
        type:  NOTIF_TYPES.LOT_READY_TRANSPORT,
      },
      [NOTIF_TYPES.TRANSPORT_STARTED]: {
        title: `Transport démarré`,
        body:  `${lotId} → ${destination}`,
        type:  NOTIF_TYPES.TRANSPORT_STARTED,
      },
      [NOTIF_TYPES.DELIVERY_CONFIRMED]: {
        title: `Livraison confirmée`,
        body:  `${lotId} livré à ${destination}`,
        type:  NOTIF_TYPES.DELIVERY_CONFIRMED,
      },
      // Admin
      [NOTIF_TYPES.USER_PENDING]: {
        title: `Nouvelle demande d'inscription`,
        body:  `${userName} attend votre approbation (${payload.role})`,
        type:  NOTIF_TYPES.USER_PENDING,
      },
      [NOTIF_TYPES.USER_APPROVED]: {
        title: `Compte approuvé`,
        body:  `${userName} a été approuvé comme ${payload.role}`,
        type:  NOTIF_TYPES.USER_APPROVED,
      },
      [NOTIF_TYPES.USER_REJECTED]: {
        title: `Compte refusé`,
        body:  `${userName} — ${payload.reason}`,
        type:  NOTIF_TYPES.USER_REJECTED,
      },
      // Système
      [NOTIF_TYPES.BLOCKCHAIN_TX]: {
        title: `Transaction blockchain confirmée`,
        body:  `Block #${payload.block} · Gas: ${payload.gas?.toLocaleString()}`,
        type:  NOTIF_TYPES.BLOCKCHAIN_TX,
      },
      [NOTIF_TYPES.SYSTEM_ALERT]: {
        title: payload.title || 'Alerte système',
        body:  payload.body  || '',
        type:  NOTIF_TYPES.SYSTEM_ALERT,
      },
      [NOTIF_TYPES.IPFS_ERROR]: {
        title: `Erreur IPFS`,
        body:  payload.error || 'Upload IPFS indisponible',
        type:  NOTIF_TYPES.IPFS_ERROR,
      },
    };

    const tpl = templates[event];
    if (!tpl) return;

    return pushNotif({ ...tpl, lotId, data: payload });
  }, [pushNotif]);

  // ── Gestion de l'état lu/non lu ───────────────────────────────────────
  const markRead = useCallback((id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotif = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifs([]);
    if (userId) localStorage.removeItem(`${LS_KEY}_${userId}`);
  }, [userId]);

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <NotifContext.Provider value={{
      // Toasts
      toasts, showToast, dismissToast,
      // Notification centre
      notifs, unreadCount, panelOpen, setPanelOpen,
      pushNotif, notify,
      markRead, markAllRead, deleteNotif, clearAll,
    }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotif() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotif must be used within NotifProvider');
  return ctx;
}

// ── Notification navigateur (Web Notification API) ────────────────────────
function _tryBrowserNotif(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(`MineralChain — ${title}`, {
        body,
        icon: '/favicon.ico',
        badge:'/favicon.ico',
        silent: false,
      });
    } catch (error) {
      return void error;
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}
