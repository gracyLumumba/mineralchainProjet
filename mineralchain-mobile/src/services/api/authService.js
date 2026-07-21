import { createUserSession } from '../../models/UserSession';
import { request } from './client';

export async function login(payload) {
  const data = await request('/auth/login', {
    method: 'POST',
    soapAction: 'LoginRequest',
    body: payload,
  });

  return createUserSession({
    ...data.user,
    token: data.token,
  });
}
