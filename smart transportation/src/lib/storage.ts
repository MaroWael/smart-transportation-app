import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'smart_transportation_auth_token';

/**
 * Token storage.
 * Native: expo-secure-store.
 * Web: localStorage (guarded with typeof window + try/catch; dev-only fallback).
 * Never AsyncStorage. Never log tokens.
 */
export const storage = {
  async getToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      // Web: localStorage (dev-only, guarded)
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    }
    // Native: SecureStore
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token: string | null): Promise<void> {
    if (typeof window !== 'undefined') {
      // Web: localStorage (dev-only, guarded)
      try {
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // dev-only: ignore storage errors
      }
      return;
    }
    // Native: SecureStore
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};
