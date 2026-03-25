import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || { error: err.message })
);

export const apiService = {
  health:          () => API.get('/health'),
  status:          () => API.get('/status'),
  contractInfo:    () => API.get('/blockchain/status'),
  analyze:         (data) => API.post('/analyze', data),
  certify:         (data) => API.post('/analyze-and-certify', data),
  getLots:         (params) => API.get('/lots', { params }),
  getLot:          (id) => API.get(`/lots/${id}`),
  updateLot:       (id, d) => API.put(`/lots/${id}`, d),
  getToken:        (id) => API.get(`/blockchain/token/${id}`),
  getTransactions: () => API.get('/blockchain/transactions'),
  validateDGMR:    (data) => API.post('/blockchain/validate-dgmr', data),
  updateIPFS:      (data) => API.post('/blockchain/update-ipfs', data),
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
  return { lot_id: formData.lot_id, ia_result: { mineral_type, confidence, impurity_level, is_fraud, status } };
}

// Simulation pour mode démo EXPLICITE — jamais appelé implicitement
export function simulateCertification(formData, iaResult) {
  const tokenId = Math.floor(Math.random() * 9000) + 1000;
  return {
    ...iaResult,
    blockchain: {
      token_id:          tokenId,
      transaction_hash:  `0x${Array.from({length:64}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')}`,
      contract_address:  '0xE7A51a1136968A33fE06bAc07B5794757E349Fbb',
      block_number:      Math.floor(Math.random() * 100000) + 1800000,
      gas_used:          Math.floor(Math.random() * 50000) + 120000,
      timestamp:         Math.floor(Date.now() / 1000),
      simulated:         true,  // ← FLAG EXPLICITE
    },
  };
}
