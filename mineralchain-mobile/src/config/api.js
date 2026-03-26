import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://127.0.0.1:5000/api',
  default: 'http://127.0.0.1:5000/api',
});

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
