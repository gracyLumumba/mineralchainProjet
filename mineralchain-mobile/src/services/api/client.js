import { getApiBaseUrl } from '../../config/api';
import { getSessionSync } from '../storage/sessionStorage';

const REQUEST_TIMEOUT_MS = 12000;

function stableJsonStringify(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map((item) => stableJsonStringify(item)).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(message)));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

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
  const method = String(restOptions.method || 'GET').toUpperCase();
  const bodyText = typeof restOptions.body === 'string'
    ? restOptions.body
    : stableJsonStringify(restOptions.body ?? {});
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(optionHeaders || {}),
  };

  if (session?.token && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const timestamp = String(Date.now());
    const nonce = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const bodyHash = await sha256Hex(bodyText);
    const signature = await hmacHex(session.token, [method, `/api${path}`, timestamp, nonce, bodyHash].join('\n'));
    headers['X-MC-Timestamp'] = timestamp;
    headers['X-MC-Nonce'] = nonce;
    headers['X-MC-Body-Hash'] = bodyHash;
    headers['X-MC-Signature'] = signature;
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...restOptions,
      headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(method) ? restOptions.body : bodyText,
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
