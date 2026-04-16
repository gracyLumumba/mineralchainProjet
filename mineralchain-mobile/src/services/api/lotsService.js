import { createLot } from '../../models/Lot';
import { request } from './client';

export async function fetchLots() {
  const payload = await request('/lots?limit=100');
  const lots = Array.isArray(payload.lots) ? payload.lots : [];
  return lots.map(createLot);
}
