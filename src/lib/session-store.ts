import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** SecureStore keys allow alphanumerics, `.`, `-` and `_`. */
const TOKEN_KEY = 'gathrly.session.token';

/**
 * Persists the session JWT.
 *
 * expo-secure-store has no web implementation, so the web build falls back to
 * localStorage. That is deliberately weaker (readable by any script on the
 * origin) but web is not a shipping target here, and the alternative is a
 * module that throws on import.
 */
const isWeb = Platform.OS === 'web';

export async function saveToken(token: string): Promise<void> {
  if (isWeb) {
    // Static web export prerenders without a DOM, hence the guard.
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    // The token only needs to be readable while the user is in the app, and
    // this keeps it out of iCloud keychain backups.
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadToken(): Promise<string | null> {
  try {
    if (isWeb) return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // A corrupt or unreadable keychain entry must not block app start —
    // treat it as signed out.
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (isWeb) {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Already gone, which is the state we wanted.
  }
}
