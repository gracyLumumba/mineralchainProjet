import axios from 'axios';
import { CONTRACT_ADDRESS } from '../config/blockchain';
import { getBackendUrl } from '../config/backend';

const BACKEND_URL = getBackendUrl();
const BACKEND_TOKEN_KEY = 'mc_backend_token';
const CURRENT_USER_KEY = 'mc_current_user';

const DEMO_PASSWORDS = {
  producteur: 'Demo2025!',
  regulateur: 'Demo2025!',
  transporteur: 'Demo2025!',
  admin: 'Admin2025!',
};

function readJsonStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    void error;
    return fallback;
  }
}

function stableJsonStringify(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map((item) => stableJsonStringify(item)).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(message)));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function refreshBackendTokenFromDemoSession() {
  const user = readJsonStorage(CURRENT_USER_KEY);
  const identifier = user?.username;
  const password = DEMO_PASSWORDS[identifier];
  if (!identifier || !password) return null;

  const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
    identifier,
    password,
  }, {
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  const token = response.data?.token;
  if (token) {
    localStorage.setItem(BACKEND_TOKEN_KEY, JSON.stringify(token));
  }
  return token || null;
}

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(async (config) => {
  try {
    const token = readJsonStorage(BACKEND_TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      const method = String(config.method || 'get').toUpperCase();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const bodyText = typeof config.data === 'string'
          ? config.data
          : stableJsonStringify(config.data ?? {});
        const timestamp = String(Date.now());
        const nonce = (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const bodyHash = await sha256Hex(bodyText);
        const path = config.url ? `/api${config.url}` : '/api';
        config.data = bodyText;
        config.headers['Content-Type'] = 'application/json';
        config.headers['X-MC-Timestamp'] = timestamp;
        config.headers['X-MC-Nonce'] = nonce;
        config.headers['X-MC-Body-Hash'] = bodyHash;
        config.headers['X-MC-Signature'] = await hmacHex(token, [method, path, timestamp, nonce, bodyHash].join('\n'));
      }
    }
  } catch (error) {
    void error;
  }
  return config;
});

API.interceptors.response.use(
  res => res.data,
  async (err) => {
    const status = err.response?.status;
    const originalRequest = err.config || {};
    if (status === 401 && !originalRequest._retriedAuth) {
      try {
        const token = await refreshBackendTokenFromDemoSession();
        if (token) {
          originalRequest._retriedAuth = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }
      } catch (error) {
        void error;
      }
    }
    return Promise.reject(err.response?.data || { error: err.message });
  }
);

export const apiService = {
  health:          () => API.get('/health'),
  status:          () => API.get('/status'),
  contractInfo:    () => API.get('/blockchain/status'),
  analyze:         (data) => API.post('/analyze', data),
  certify:         (data) => API.post('/analyze-and-certify', data, { timeout: 120000 }),
  createLot:       (data) => API.post('/lots', data),
  getLots:         (params) => API.get('/lots', { params }),
  getLot:          (id) => API.get(`/lots/${id}`),
  updateLot:       (id, d) => API.put(`/lots/${id}`, d),
  getToken:        (id) => API.get(`/blockchain/token/${id}`),
  getTransactions: () => API.get('/blockchain/transactions'),
  validateDGMR:    (data) => API.post('/blockchain/validate-dgmr', data),
  regulatorCertifyLot: (lotId, data) => API.post(`/lots/${lotId}/regulator-certify`, data, { timeout: 120000 }),
  updateIPFS:      (data) => API.post('/blockchain/update-ipfs', data),
  autoValidateLot: (lotId) => API.post(`/lots/${lotId}/auto-validate`, {}),
};

// ── Simulation IA locale UNIQUEMENT (mode démo sans backend) ─────────────────
// IMPORTANT : simulateCertification() N'EST PLUS appelé silencieusement.
// Le frontend affiche maintenant une erreur claire si le backend est inaccessible.
export function simulateAnalysis(formData) {
  const cu = parseFloat(formData.cu_grade_percent) || 0;
  const co = parseFloat(formData.co_grade_percent) || 0;
  const fe = parseFloat(formData.fe_percent) || 0;
  const mineral_type   = cu > co * 1.5 ? 'copper' : co > cu * 1.5 ? 'cobalt' : 'mixed';
  const impurity_level = fe > 12 ? 'high' : fe > 7 ? 'medium' : 'low';
  const confidence     = 0.78 + Math.random() * 0.20;
  const is_fraud       = Math.random() < 0.08;
  const status         = is_fraud ? 'SUSPECT' : confidence > 0.85 ? 'AUTHENTIQUE' : 'À VÉRIFIER';
  return {
    lot_id: formData.lot_id,
    ia_result: {
      mineral_type,
      confidence,
      impurity_level,
      is_fraud,
      status,
      fingerprint: {
        chemical_composition: {
          cu,
          co,
          fe,
          ni: parseFloat(formData.ni_percent) || 0,
          s: parseFloat(formData.s_percent) || 0,
          silica: parseFloat(formData.silica_percent) || 0,
        },
        geological_origin: formData.geological_origin || 'non renseignee',
        texture: formData.texture || 'non renseignee',
      },
    },
  };
}

// Simulation pour mode démo EXPLICITE — jamais appelé implicitement
export function simulateCertification(formData, iaResult) {
  const tokenId = Math.floor(Math.random() * 9000) + 1000;
  return {
    ...iaResult,
    blockchain: {
      token_id:          tokenId,
      transaction_hash:  `0x${Array.from({length:64}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')}`,
      contract_address:  CONTRACT_ADDRESS,
      block_number:      Math.floor(Math.random() * 100000) + 1800000,
      gas_used:          Math.floor(Math.random() * 50000) + 120000,
      timestamp:         Math.floor(Date.now() / 1000),
      simulated:         true,  // ← FLAG EXPLICITE
    },
  };
}
