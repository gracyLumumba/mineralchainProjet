export function createLot(payload = {}) {
  return {
    id: payload.lot_id || 'inconnu',
    status: payload.status || 'INCONNU',
    site: payload.site || 'inconnu',
    weight: payload.weight ?? 0,
    ownerUserId: payload.owner_user_id || null,
    ownerUsername: payload.owner_username || null,
    ownerName: payload.owner_name || null,
    tokenId: payload.token_id ?? null,
    blockNumber: payload.block_number ?? null,
    certificateId: payload.certificate_id || null,
    regulatorValidated: payload.regulator_validated ?? false,
    regulatorValidatedAt: payload.regulator_validated_at || null,
    transportStatus: payload.transport_status || null,
    destination: payload.destination || null,
    analyzedAt: payload.analyzed_at || null,
    mineralType: payload.mineral_type || null,
    confidence: payload.confidence ?? null,
    updatedAt: payload.updated_at || payload.created_at || null,
    storage: payload.storage || 'unknown',
  };
}
