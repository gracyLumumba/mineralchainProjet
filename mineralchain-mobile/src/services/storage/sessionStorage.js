import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserSession } from '../../models/UserSession';

const SESSION_KEY = 'mc_mobile_session';
let memorySession = null;

export async function saveSession(session) {
  memorySession = createUserSession(session);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(memorySession));
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    memorySession = null;
    return null;
  }

  try {
    memorySession = createUserSession(JSON.parse(raw));
    return memorySession;
  } catch {
    memorySession = null;
    return null;
  }
}

export function getSessionSync() {
  return memorySession;
}

export async function clearSession() {
  memorySession = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}
