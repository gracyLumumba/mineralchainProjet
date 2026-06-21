export function createBlockchainTransaction(payload = {}) {
  return {
    hash: payload.hash || payload.tx_hash || '',
    blockNumber: payload.block_number ?? null,
    from: payload.from || '',
    to: payload.to || '',
    value: payload.value || '0',
  };
}
