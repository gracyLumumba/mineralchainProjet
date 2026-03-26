import { createHealthStatus } from '../../models/HealthStatus';
import { request } from './client';

export async function fetchHealthStatus() {
  const payload = await request('/health');
  return createHealthStatus(payload);
}
