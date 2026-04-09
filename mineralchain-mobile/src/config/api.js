import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { loadApiPreferences, saveApiPreferences } from '../services/storage/preferencesStorage';

function normalizeApiBaseUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function getExpoHostUri() {
  return (
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    ''
  );
}

function getExpoLanBaseUrl() {
  const hostUri = getExpoHostUri();
  const host = hostUri.split(':')[0];

  if (!host || host === '127.0.0.1' || host === 'localhost') {
    return '';
  }

  return `http://${host}:5000/api`;
}

const DEVICE_API_BASE_URL = normalizeApiBaseUrl(getExpoLanBaseUrl());

const DEFAULT_API_BASE_URL = normalizeApiBaseUrl(
  DEVICE_API_BASE_URL ||
  Platform.select({
    android: 'http://10.0.2.2:5000/api',
    ios: 'http://127.0.0.1:5000/api',
    default: 'http://127.0.0.1:5000/api',
  })
);

const ENV_API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export function getDefaultApiBaseUrl() {
  return ENV_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export async function getApiBaseUrl() {
  const stored = await loadApiPreferences();
  return normalizeApiBaseUrl(stored.apiBaseUrl) || getDefaultApiBaseUrl();
}

export async function setCustomApiBaseUrl(value) {
  await saveApiPreferences({ apiBaseUrl: normalizeApiBaseUrl(value) });
}

export async function resetCustomApiBaseUrl() {
  await saveApiPreferences({ apiBaseUrl: '' });
}
