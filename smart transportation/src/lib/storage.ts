import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'smart_transportation_auth_token';
const ONBOARDING_KEY = 'smart_transit_onboarding_seen';

const isWeb = Platform.OS === 'web';

/**
 * Persistent storage.
 * Native (Android / iOS): expo-secure-store.
 * Web: localStorage (guarded with try/catch).
 * Never log tokens.
 */
export const storage = {
  async getToken(): Promise<string | null> {
    if (isWeb) {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string | null): Promise<void> {
    if (isWeb) {
      try {
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // ignore storage errors
      }
      return;
    }
    try {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      // ignore storage errors
    }
  },

  async getOnboardingSeen(): Promise<boolean> {
    if (isWeb) {
      try {
        return localStorage.getItem(ONBOARDING_KEY) === 'true';
      } catch {
        return false;
      }
    }
    try {
      const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingSeen(seen: boolean): Promise<void> {
    if (isWeb) {
      try {
        if (seen) {
          localStorage.setItem(ONBOARDING_KEY, 'true');
        } else {
          localStorage.removeItem(ONBOARDING_KEY);
        }
      } catch {
        // ignore storage errors
      }
      return;
    }
    try {
      if (seen) {
        await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(ONBOARDING_KEY);
      }
    } catch {
      // ignore storage errors
    }
  },
};
