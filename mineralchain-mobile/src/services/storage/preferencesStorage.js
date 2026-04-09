import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'mc_mobile_preferences';
const API_PREFS_KEY = 'mc_mobile_api_preferences';

export async function loadPreferences() {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) {
    return { theme: 'light', language: 'fr' };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      language: parsed.language === 'en' ? 'en' : 'fr',
    };
  } catch {
    return { theme: 'light', language: 'fr' };
  }
}

export async function savePreferences(preferences) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
}

export async function loadApiPreferences() {
  const raw = await AsyncStorage.getItem(API_PREFS_KEY);
  if (!raw) {
    return { apiBaseUrl: '' };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      apiBaseUrl: typeof parsed.apiBaseUrl === 'string' ? parsed.apiBaseUrl : '',
    };
  } catch {
    return { apiBaseUrl: '' };
  }
}

export async function saveApiPreferences(preferences) {
  await AsyncStorage.setItem(API_PREFS_KEY, JSON.stringify(preferences));
}
