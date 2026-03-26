import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserSession } from '../../models/UserSession';

const SESSION_KEY = 'mc_mobile_session';

export async function saveSession(session) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return createUserSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
