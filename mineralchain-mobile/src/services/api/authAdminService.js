import { request } from './client';

export async function fetchAdminUsers() {
  const payload = await request('/auth/users');
  return Array.isArray(payload.users) ? payload.users : [];
}

export async function approveAdminUser(userId) {
  const payload = await request(`/auth/users/${userId}/approve`, {
    method: 'POST',
  });
  return payload.user;
}

export async function rejectAdminUser(userId, reason = '') {
  const payload = await request(`/auth/users/${userId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return payload.user;
}

export async function revokeAdminUser(userId) {
  const payload = await request(`/auth/users/${userId}/revoke`, {
    method: 'POST',
  });
  return payload.user;
}
