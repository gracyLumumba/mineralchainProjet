export function createLot(payload = {}) {
  return {
    id: payload.lot_id || 'inconnu',
    status: payload.status || 'INCONNU',
    site: payload.site || 'inconnu',
    weight: payload.weight ?? 0,
    tokenId: payload.token_id ?? null,
    blockNumber: payload.block_number ?? null,
    certificateId: payload.certificate_id || null,
    updatedAt: payload.updated_at || payload.created_at || null,
    storage: payload.storage || 'unknown',
  };
}
