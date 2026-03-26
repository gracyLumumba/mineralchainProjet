import { createLot } from '../../models/Lot';
import { request } from './client';

export async function fetchLotDetail(lotId) {
  const payload = await request(`/lots/${lotId}`);
  return createLot(payload);
}
