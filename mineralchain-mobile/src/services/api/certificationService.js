import { createCertificationResult } from '../../models/CertificationResult';
import { request } from './client';

export async function certifyLot(payload) {
  const data = await request('/analyze-and-certify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return createCertificationResult(data);
}
