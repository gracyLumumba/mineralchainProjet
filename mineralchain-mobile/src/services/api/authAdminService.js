import { request } from './client';

export async function fetchAdminUsers() {
  const payload = await request('/auth/users');
  return Array.isArray(payload.users) ? payload.users : [];
}

export async function approveAdminUser(userId) {
  const payload = await request(`/auth/users/${userId}/approve`, {
    method: 'POST',
    soapAction: 'ApproveUserRequest',
  });
  return payload.user;
}

export async function rejectAdminUser(userId, reason = '') {
  const payload = await request(`/auth/users/${userId}/reject`, {
    method: 'POST',
    soapAction: 'RejectUserRequest',
    body: { reason },
  });
  return payload.user;
}

export async function revokeAdminUser(userId) {
  const payload = await request(`/auth/users/${userId}/revoke`, {
    method: 'POST',
    soapAction: 'RevokeUserRequest',
  });
  return payload.user;
}
