export function createUserSession(payload = {}) {
  return {
    name: payload.name || 'Operateur',
    role: payload.role || 'producer',
    site: payload.site || 'Kamoa-Kansoko',
  };
}
