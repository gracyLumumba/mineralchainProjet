function normalizeLocalBackendUrl(rawUrl) {
  if (!rawUrl || typeof window === 'undefined') return rawUrl;

  try {
    const currentHost = window.location.hostname;
    const parsed = new URL(rawUrl);
    const localHosts = new Set(['localhost', '127.0.0.1']);

    if (localHosts.has(parsed.hostname) && localHosts.has(currentHost)) {
      parsed.hostname = currentHost;
      return parsed.toString().replace(/\/$/, '');
    }
  } catch (error) {
    void error;
  }

  return rawUrl;
}

export function getBackendUrl() {
  const envUrl = normalizeLocalBackendUrl(process.env.REACT_APP_BACKEND_URL);
  if (envUrl) return envUrl;

  const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  return `http://${host}:5000`;
}
