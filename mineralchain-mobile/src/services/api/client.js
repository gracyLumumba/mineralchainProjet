import { getApiBaseUrl } from '../../config/api';
import { getSessionSync } from '../storage/sessionStorage';

const REQUEST_TIMEOUT_MS = 12000;

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function request(path, options = {}) {
  const session = getSessionSync();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const apiBaseUrl = await getApiBaseUrl();

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
      ...options,
    });
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    const message = isTimeout
      ? `Delai depasse vers ${apiBaseUrl}`
      : `Connexion impossible vers ${apiBaseUrl}`;
    throw new Error(message);
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      data?.error || data?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}
