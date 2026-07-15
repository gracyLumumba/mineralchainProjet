import { getApiBaseUrl } from '../../config/api';
import { getSessionSync } from '../storage/sessionStorage';

const REQUEST_TIMEOUT_MS = 12000;

export function isNetworkUnavailableError(error) {
  const message = String(error?.message || '').toLowerCase();
  return Boolean(
    error?.isNetworkUnavailable ||
    message.includes('delai depasse') ||
    message.includes('timeout') ||
    message.includes('connexion impossible')
  );
}

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
  const { headers: optionHeaders, ...restOptions } = options;

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...restOptions,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(optionHeaders || {}),
      },
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    const message = isTimeout
      ? `Delai depasse vers ${apiBaseUrl}`
      : `Connexion impossible vers ${apiBaseUrl}`;
    const networkError = new Error(message);
    networkError.isNetworkUnavailable = true;
    networkError.isTimeout = isTimeout;
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      data?.error || data?.message || `HTTP ${response.status}`;
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.data = data;
    throw requestError;
  }

  return data;
}
