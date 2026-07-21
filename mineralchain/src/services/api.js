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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSoapEnvelope(action, payload) {
  const body = JSON.stringify(payload ?? {});
  return `<?xml version="1.0" encoding="utf-8"?>${'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>'}<${action}>${escapeXml(body)}</${action}></soap:Body></soap:Envelope>`;
}

function parseSoapResponse(data) {
  if (typeof data !== 'string') {
    return data;
  }

  const trimmed = data.trim();
  if (!trimmed.startsWith('<')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return { raw: trimmed };
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'text/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    return { raw: trimmed };
  }

  const body = doc.getElementsByTagNameNS('http://schemas.xmlsoap.org/soap/envelope/', 'Body')[0]
    || doc.getElementsByTagName('soap:Body')[0];
  const payloadNode = body?.firstElementChild;
  const payloadText = payloadNode?.textContent?.trim() || '';
  if (!payloadText) return {};

  try {
    return JSON.parse(payloadText);
  } catch {
    return { raw: payloadText };
  }
}

async function refreshBackendTokenFromDemoSession() {
  const user = readJsonStorage(CURRENT_USER_KEY);
  const identifier = user?.username;
  const password = DEMO_PASSWORDS[identifier];
  if (!identifier || !password) return null;

  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: 'LoginRequest',
    },
    body: buildSoapEnvelope('LoginRequest', { identifier, password }),
  });
  const text = await response.text();
  const tokenPayload = parseSoapResponse(text);
  const token = tokenPayload?.token;
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
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.soapAction) {
      if (config._soapBody === undefined) {
        config._soapBody = config.data ?? {};
      }
      config.data = buildSoapEnvelope(config.soapAction, config._soapBody);
      config.headers['Content-Type'] = 'text/xml; charset=utf-8';
      config.headers.SOAPAction = config.soapAction;
      config.responseType = 'text';
    }
  } catch (error) {
    void error;
  }
  return config;
});

API.interceptors.response.use(
  res => parseSoapResponse(res.data),
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
    const payload = parseSoapResponse(err.response?.data) || { error: err.message };
    return Promise.reject(payload);
  }
);

export const apiService = {
  health:          () => API.get('/health'),
  status:          () => API.get('/status'),
  contractInfo:    () => API.get('/blockchain/status'),
  analyze:         (data) => API.post('/analyze', data, { soapAction: 'AnalyzeRequest' }),
  certify:         (data) => API.post('/analyze-and-certify', data, { soapAction: 'AnalyzeAndCertifyRequest', timeout: 120000 }),
  createLot:       (data) => API.post('/lots', data, { soapAction: 'CreateLotRequest' }),
  getLots:         (params) => API.get('/lots', { params }),
  getLot:          (id) => API.get(`/lots/${id}`),
  updateLot:       (id, d) => API.put(`/lots/${id}`, d, { soapAction: 'UpdateLotRequest' }),
  getToken:        (id) => API.get(`/blockchain/token/${id}`),
  getTransactions: () => API.get('/blockchain/transactions'),
  validateDGMR:    (data) => API.post('/blockchain/validate-dgmr', data, { soapAction: 'ValidateDGMRRequest' }),
  regulatorCertifyLot: (lotId, data) => API.post(`/lots/${lotId}/regulator-certify`, data, { soapAction: 'RegulatorCertifyRequest', timeout: 120000 }),
  updateIPFS:      (data) => API.post('/blockchain/update-ipfs', data, { soapAction: 'UpdateIPFSRequest' }),
  autoValidateLot: (lotId) => API.post(`/lots/${lotId}/auto-validate`, {}, { soapAction: 'AutoValidateRequest' }),
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
      ai_scope: {
        title: 'Clarification du role de l\'IA',
        quantitative_inputs: ['cu_grade_percent', 'co_grade_percent', 'fe_percent', 'ni_percent', 's_percent', 'silica_percent', 'density_t_m3', 'moisture_percent', 'hardness_mohs', 'weight_tonnes'],
        fingerprint_fields: {
          geological_origin: formData.geological_origin || 'non renseignee',
          texture: formData.texture || 'non renseignee',
        },
        model_scope: [
          'Le modele IA utilise des mesures quantitatives stables pour classer le lot.',
          'L\'origine geologique et la texture enrichissent l\'empreinte mineralogique, mais ne sont pas encore des entrees principales du classifieur.',
          'SHAP sert ensuite a montrer quelles variables ont influence la prediction.',
        ],
        why_not_full_fingerprint: 'Les champs qualitatifs restent utiles pour la traçabilité, mais ils doivent etre reentraines et revalides avant de devenir des variables predictives principales.',
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
