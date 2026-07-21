import { getApiBaseUrl } from '../../config/api';
import { getSessionSync } from '../storage/sessionStorage';

const REQUEST_TIMEOUT_MS = 12000;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function decodeXml(value) {
  return String(value)
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function buildSoapEnvelope(action, payload) {
  const body = JSON.stringify(payload ?? {});
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${action}>${escapeXml(body)}</${action}></soap:Body></soap:Envelope>`;
}

function parseSoapResponse(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return {};
  if (!trimmed.startsWith('<')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return { raw: trimmed };
    }
  }

  const match = trimmed.match(/<soap:Body[^>]*>\s*<[^>]+>([\s\S]*?)<\/[^>]+>\s*<\/soap:Body>/i);
  const payloadText = decodeXml(match?.[1] || '');
  if (!payloadText) return {};

  try {
    return JSON.parse(payloadText);
  } catch {
    return { raw: payloadText };
  }
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

export async function request(path, options = {}) {
  const session = getSessionSync();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const apiBaseUrl = await getApiBaseUrl();
  const { headers: optionHeaders, soapAction, ...restOptions } = options;
  const method = String(restOptions.method || 'GET').toUpperCase();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(optionHeaders || {}),
  };

  let body = restOptions.body;
  if (soapAction) {
    body = buildSoapEnvelope(soapAction, restOptions.body ?? {});
    headers['Content-Type'] = 'text/xml; charset=utf-8';
    headers.SOAPAction = soapAction;
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...restOptions,
      headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(method) ? restOptions.body : body,
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

  const text = await response.text();
  const data = parseSoapResponse(text);

  if (!response.ok) {
    const message = data?.error || data?.message || `HTTP ${response.status}`;
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.data = data;
    throw requestError;
  }

  return data;
}
