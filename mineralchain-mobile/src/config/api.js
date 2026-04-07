import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

const DEVICE_API_BASE_URL = getExpoLanBaseUrl();

const DEFAULT_API_BASE_URL =
  DEVICE_API_BASE_URL ||
  Platform.select({
    android: 'http://10.0.2.2:5000/api',
    ios: 'http://127.0.0.1:5000/api',
    default: 'http://127.0.0.1:5000/api',
  });

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
