export function createCertificationResult(payload = {}) {
  const blockchain = payload.blockchain || {};
  const certificate = payload.certificate || {};
  const ia = payload.ia_result || {};
  const rawMineralType = ia.mineral_type || 'unknown';
  const normalizedMineralType =
    ['unknown', 'inconnu', 'none', 'null', ''].includes(String(rawMineralType).trim().toLowerCase())
      ? 'Non determine'
      : rawMineralType;

  return {
    lotId: payload.lot_id || 'inconnu',
    status: ia.status || 'INCONNU',
    mineralType: normalizedMineralType,
    confidence: ia.confidence ?? 0,
    tokenId: blockchain.token_id ?? null,
    blockNumber: blockchain.block_number ?? null,
    transactionHash: blockchain.transaction_hash || null,
    contractAddress: blockchain.contract_address || null,
    simulated: Boolean(blockchain.simulated),
    certificateHash: certificate.hash || null,
    ipfsHash: certificate.ipfs_hash || null,
    gatewayUrl: certificate.gateway_url || null,
  };
}
