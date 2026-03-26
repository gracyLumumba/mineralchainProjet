export function createUserSession(payload = {}) {
  return {
    id: payload.id || null,
    name: payload.name || 'Operateur',
    role: payload.role || 'producer',
    site: payload.site || 'Kamoa-Kansoko',
    email: payload.email || '',
    username: payload.username || '',
    organization: payload.organization || '',
  };
}
