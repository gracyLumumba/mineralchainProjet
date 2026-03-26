import { createUserSession } from '../../models/UserSession';
import { request } from './client';

export async function register(payload) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    message: data.message || '',
    user: createUserSession(data.user),
  };
}
