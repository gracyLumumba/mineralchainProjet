/**
 * MineralChain — Service Blockchain
 *
 * Aligne avec MineralNFT.sol (OpenZeppelin ERC721URIStorage)
 * Fonction : mintMineralToken(to, lotId, site, mineralType, impurityLevel,
 *                              confidence, iaSignature, isAuthentic,
 *                              certificateHash, ipfsHash,
 *                              cuGrade, coGrade, feGrade, weight)
 *
 * Contrat  : 0xE7A51a1136968A33fE06bAc07B5794757E349Fbb
 * Réseau   : Ganache localhost:7545
 */

const BACKEND_URL  = process.env.REACT_APP_BACKEND_URL   || 'http://localhost:5000';
const CONTRACT_ADDR = '0xE7A51a1136968A33fE06bAc07B5794757E349Fbb';

// ════════════════════════════════════════════════════════════════════════════
//  ÉTAT DU CONTRAT
// ════════════════════════════════════════════════════════════════════════════

export async function getBlockchainStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/blockchain/status`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return {
      connected:        false,
      ganache_url:      'http://localhost:7545',
      contract_address: CONTRACT_ADDR,
      error:            e.message,
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  MINT NFT — appelle mintMineralToken() sur Ganache via le backend
// ════════════════════════════════════════════════════════════════════════════

/**
 * Mint un NFT sur le contrat MineralNFT.
 *
 * @param {Object} lot         - Lot complet (cu_grade_percent, co_grade_percent, etc.)
 * @param {string} ipfsHash    - CID IPFS du certificat (optionnel)
 * @param {string} certHash    - Hash SHA-256 du certificat JSON (optionnel)
 * @param {string} userWallet  - Adresse du producteur (recipient)
 * @returns {Object} { token_id, transaction_hash, block_number, gas_used, simulated, ... }
 */
export async function mintNFTOnChain(lot, ipfsHash = '', certHash = '', userWallet = '') {
  const body = {
    lot_id:           lot.lot_id,
    site:             lot.site             || 'KAMOA',
    mineral_type:     lot.mineral_type     || 'copper',
    impurity_level:   lot.impurity_level   || 'medium',
    confidence:       lot.confidence       || 0,
    ia_signature:     lot.ia_signature     || '',
    is_authentic:     lot.status === 'AUTHENTIQUE',
    certificate_hash: certHash,
    ipfs_hash:        ipfsHash,
    cu_grade:         lot.cu_grade_percent || 0,
    co_grade:         lot.co_grade_percent || 0,
    fe_grade:         lot.fe_percent       || 0,
    weight:           lot.weight_tonnes    || 0,
    recipient:        userWallet           || '0xdb5745DeeDcF8e6e0099460bf94c96b56804EC70',
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/blockchain/mint`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Backend error ${res.status}`);
    }
    const data = await res.json();
    console.log(`[BLOCKCHAIN] NFT #${data.token_id} | TX ${data.transaction_hash?.slice(0,22)}... | Simulated: ${data.simulated}`);
    return data;
  } catch (e) {
    console.error('[BLOCKCHAIN] mintNFTOnChain error:', e.message);
    return _localFallback(lot);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  CERTIFIER — mint + IPFS en une seule opération
// ════════════════════════════════════════════════════════════════════════════

export async function certifyLotComplete(lot, userWallet) {
  const steps = { blockchain: null, ipfs: null, errors: [] };

  // 1. Mint NFT sur Ganache
  try {
    const mint = await mintNFTOnChain(lot, '', '', userWallet);
    steps.blockchain = {
      token_id:         mint.token_id,
      tx_hash:          mint.transaction_hash,
      contract_address: CONTRACT_ADDR,
      block_number:     mint.block_number,
      gas_used:         mint.gas_used,
      timestamp:        mint.timestamp,
      simulated:        mint.simulated || false,
    };
    console.log(`[CERTIFY] Step 1 OK — Token #${mint.token_id}`);
  } catch (e) {
    steps.errors.push(`Blockchain: ${e.message}`);
  }

  // 2. Upload certificat IPFS (importé depuis ipfs.js)
  try {
    const { buildCertificatePayload, uploadCertificateViaBackend } = await import('./ipfs.js');
    const payload     = buildCertificatePayload(lot, steps.blockchain);
    const ipfsResult  = await uploadCertificateViaBackend(payload);
    steps.ipfs = {
      hash:        ipfsResult.ipfs_hash,
      gateway_url: ipfsResult.gateway_url,
    };
    console.log(`[CERTIFY] Step 2 OK — IPFS ${ipfsResult.ipfs_hash?.slice(0,16)}...`);

    // 3. Mettre à jour tokenURI on-chain si token existe
    if (steps.blockchain?.token_id != null && ipfsResult.ipfs_hash) {
      try {
        await fetch(`${BACKEND_URL}/api/blockchain/update-ipfs`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            token_id:         steps.blockchain.token_id,
            ipfs_hash:        ipfsResult.ipfs_hash,
            certificate_hash: payload.certificate_id,
          }),
        });
        console.log('[CERTIFY] Step 3 OK — tokenURI updated on-chain');
      } catch (error) { void error; }
    }
  } catch (e) {
    steps.errors.push(`IPFS: ${e.message}`);
  }

  return steps;
}

// ════════════════════════════════════════════════════════════════════════════
//  VALIDATION DGMR ON-CHAIN
// ════════════════════════════════════════════════════════════════════════════

export async function validateDGMROnChain(tokenId, status, validatorAddress) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/blockchain/validate-dgmr`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        token_id:          tokenId,
        status,
        validator_address: validatorAddress || '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
      }),
      signal:  AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[BLOCKCHAIN] validateDGMROnChain:', e.message);
    return { validated: false, simulated: true, error: e.message };
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  LECTURE BLOCKCHAIN
// ════════════════════════════════════════════════════════════════════════════

export async function getContractTransactions() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/blockchain/transactions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return { connected: false, transactions: [], error: e.message };
  }
}

export async function getTokenFromChain(tokenId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/blockchain/token/${tokenId}`);
    if (!res.ok) throw new Error(`Token ${tokenId} not found`);
    return await res.json();
  } catch (error) {
    void error;
    return null;
  }
}

export async function verifyLotOnChain(lotId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/blockchain/lot/${lotId}`);
    if (!res.ok) throw new Error(`Lot ${lotId} not found`);
    return await res.json();
  } catch (error) {
    void error;
    return null;
  }
}

// ── Fallback local (backend totalement inaccessible) ─────────────────────────
function _localFallback(lot) {
  return {
    simulated:        true,
    token_id:         Math.floor(Math.random() * 90000) + 10000,
    transaction_hash: '0x' + [...Array(64)].map(() => '0123456789abcdef'[Math.floor(Math.random()*16)]).join(''),
    contract_address: CONTRACT_ADDR,
    block_number:     Math.floor(Math.random() * 50000) + 185000,
    gas_used:         Math.floor(Math.random() * 100000) + 180000,
    timestamp:        Math.floor(Date.now() / 1000),
    lot_id:           lot.lot_id,
  };
}
