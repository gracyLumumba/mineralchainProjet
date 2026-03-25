// ═══════════════════════════════════════════════════════════════════════════
//  MineralChain — Service IPFS / Pinata
//  Stockage décentralisé et permanent des certificats
// ═══════════════════════════════════════════════════════════════════════════

const PINATA_JWT   = process.env.REACT_APP_PINATA_JWT || '';
const PINATA_GW    = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
const BACKEND_URL  = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

//  Helpers 

/**
 * Construit l'URL publique IPFS via la gateway configurée
 */
export function ipfsGatewayUrl(hash) {
  if (!hash) return null;
  // Supporte ipfs://Qm... et les hash bruts
  const cleanHash = hash.replace('ipfs://', '');
  return `${PINATA_GW}/ipfs/${cleanHash}`;
}

/**
 * Construit le certificat JSON v2.0 complet depuis un lot
 */
export function buildCertificatePayload(lot, token) {
  return {
    version:        '2.0',
    format:         'IPFS-CERT',
    certificate_id: `CERT-${lot.lot_id}-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}`,
    lot_id:         lot.lot_id,
    token_id:       token?.token_id ?? lot.token_id ?? null,
    mineral_type:   lot.mineral_type,
    status:         lot.status,
    confidence:     lot.confidence,
    impurity_level: lot.impurity_level,
    is_fraud:       lot.is_fraud || false,
    site:           lot.site || lot.site_code,
    extraction_date: lot.extraction_date,
    analyzed_at:    lot.analyzed_at || new Date().toISOString(),

    composition: {
      cu:     lot.cu_grade_percent   ?? null,
      co:     lot.co_grade_percent   ?? null,
      fe:     lot.fe_percent         ?? null,
      ni:     lot.ni_percent         ?? null,
      s:      lot.s_percent          ?? null,
      silica: lot.silica_percent     ?? null,
    },

    physical: {
      density:  lot.density_t_m3      ?? null,
      moisture: lot.moisture_percent  ?? null,
      hardness: lot.hardness_mohs     ?? null,
      weight:   lot.weight_tonnes     ?? null,
    },

    blockchain: token ? {
      token_id:          token.token_id,
      transaction_hash:  token.tx_hash,
      contract_address:  token.contract || '0xE7A51a1136968A33fE06bAc07B5794757E349Fbb',
      block_number:      token.block,
      timestamp:         token.timestamp,
    } : null,

    ia_signature: `0x${Array.from({ length: 40 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,

    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Upload direct via Pinata (frontend, nécessite JWT exposé)
//  ATTENTION: En production : préférer le proxy backend pour ne pas exposer le JWT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload un certificat directement sur Pinata depuis le navigateur.
 * Retourne { ipfs_hash, gateway_url } ou throw si erreur.
 */
export async function uploadCertificateDirect(certPayload) {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT non configuré. Définissez REACT_APP_PINATA_JWT dans .env');
  }

  const lotId = certPayload.lot_id || 'unknown';
  const body  = {
    pinataContent: certPayload,
    pinataMetadata: {
      name:    `MineralChain-${lotId}`,
      keyvalues: {
        lot_id:       lotId,
        mineral_type: certPayload.mineral_type || '',
        status:       certPayload.status        || '',
        site:         certPayload.site          || '',
        token_id:     String(certPayload.token_id ?? ''),
        version:      certPayload.version,
      },
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.reason || err?.error || `Pinata error ${res.status}`);
  }

  const data = await res.json();
  return {
    ipfs_hash:   data.IpfsHash,
    gateway_url: ipfsGatewayUrl(data.IpfsHash),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Upload via backend Flask (proxy sécurisé — RECOMMANDÉ)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload via le backend Flask qui garde le JWT côté serveur.
 * Fallback automatique sur l'upload direct si le backend est hors-ligne.
 */
export async function uploadCertificateViaBackend(certPayload) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ipfs/upload`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(certPayload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Backend error ${res.status}`);
    }

    const data = await res.json();
    return {
      ipfs_hash:   data.ipfs_hash,
      gateway_url: data.gateway_url || ipfsGatewayUrl(data.ipfs_hash),
    };
  } catch (backendErr) {
    // Fallback → upload direct si JWT disponible
    if (PINATA_JWT) {
      console.warn('[IPFS] Backend inaccessible, fallback upload direct:', backendErr.message);
      return uploadCertificateDirect(certPayload);
    }
    throw backendErr;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Récupération d'un certificat depuis IPFS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère un certificat depuis IPFS via la gateway.
 * Essaie d'abord le backend, puis la gateway directe.
 */
export async function fetchCertificateFromIPFS(ipfsHash) {
  const cleanHash = ipfsHash.replace('ipfs://', '');

  // 1. Essai via backend
  try {
    const res = await fetch(`${BACKEND_URL}/api/ipfs/get/${cleanHash}`);
    if (res.ok) return await res.json();
  } catch (error) { void error; }

  // 2. Essai gateway directe
  const gwUrl = ipfsGatewayUrl(cleanHash);
  const res   = await fetch(gwUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`IPFS gateway error ${res.status}`);
  return await res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
//  Pin d'un hash existant
// ═══════════════════════════════════════════════════════════════════════════

export async function pinExistingHash(ipfsHash, lotId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ipfs/pin/${ipfsHash}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lot_id: lotId }),
    });
    return res.ok;
  } catch (error) {
    void error;
    // Fallback direct Pinata
    if (!PINATA_JWT) return false;
    const res = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PINATA_JWT}` },
      body:    JSON.stringify({ hashToPin: ipfsHash, pinataMetadata: { name: `MineralChain-${lotId}` } }),
    });
    return res.ok;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Utilitaire : format hash IPFS court
// ═══════════════════════════════════════════════════════════════════════════
export function shortIpfsHash(hash, n = 8) {
  if (!hash) return '—';
  const clean = hash.replace('ipfs://', '');
  return `${clean.slice(0, n)}...${clean.slice(-6)}`;
}

// Re-export for backward compatibility
export { mintNFTOnChain, certifyLotComplete, getBlockchainStatus } from './blockchain';
