import { request } from './client';

export async function autoValidateLot(lotId) {
  return request(`/lots/${lotId}/auto-validate`, {
    method: 'POST',
  });
}
