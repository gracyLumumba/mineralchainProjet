import { request } from './client';
import { createBlockchainTransaction } from '../../models/BlockchainTransaction';

export async function fetchBlockchainTransactions() {
  const payload = await request('/blockchain/transactions');
  const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
  return {
    connected: payload.connected !== false,
    error: payload.error || '',
    transactions: transactions.map(createBlockchainTransaction),
  };
}
