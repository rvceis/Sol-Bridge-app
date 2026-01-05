/**
 * Cross-platform secure storage utility
 * Uses SecureStore on native and localStorage on web
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Web storage fallback
const webStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

// Export platform-appropriate storage
export const secureStorage = Platform.OS === 'web' ? webStorage : SecureStore;

// Convenience functions
export async function getItem(key: string): Promise<string | null> {
  try {
    return await secureStorage.getItemAsync(key);
  } catch (error) {
    console.warn('Storage getItem error:', error);
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    await secureStorage.setItemAsync(key, value);
  } catch (error) {
    console.warn('Storage setItem error:', error);
  }
}

export async function deleteItem(key: string): Promise<void> {
  try {
    await secureStorage.deleteItemAsync(key);
  } catch (error) {
    console.warn('Storage deleteItem error:', error);
  }
}

export default secureStorage;
