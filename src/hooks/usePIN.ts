import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '@/src/constants';

export async function savePIN(pin: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.PIN, pin);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(SECURE_STORE_KEYS.PIN);
  return stored === pin;
}

export async function hasPIN(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(SECURE_STORE_KEYS.PIN);
  return stored !== null && stored.length > 0;
}

export async function clearPIN(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PIN);
}
