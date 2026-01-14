/**
 * Cross-platform storage utility
 * Uses AsyncStorage on native and localStorage on web
 * NO SecureStore - causes runtime issues with Expo
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback storage (as last resort)
const memoryStorage = new Map<string, string>();

// Check if we're on web
const isWeb = Platform.OS === 'web';

/**
 * Get item from storage
 */
export async function getItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      // Web: use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(key);
        console.log(`[Storage] Retrieved ${key} from localStorage:`, !!value);
        return value;
      }
      return null;
    } else {
      // Native: use AsyncStorage
      const value = await AsyncStorage.getItem(key);
      console.log(`[Storage] Retrieved ${key} from AsyncStorage:`, !!value);
      if (value) {
        return value;
      }
    }
    
    // Fallback to memory
    const memValue = memoryStorage.get(key);
    console.log(`[Storage] Retrieved ${key} from memory:`, !!memValue);
    return memValue || null;
  } catch (error) {
    console.error(`[Storage] getItem error for ${key}:`, error);
    const memValue = memoryStorage.get(key);
    console.log(`[Storage] Using memory fallback for ${key}:`, !!memValue);
    return memValue || null;
  }
}

/**
 * Set item in storage
 */
export async function setItem(key: string, value: string): Promise<void> {
  if (!value) {
    console.warn(`[Storage] Trying to store empty value for ${key}`);
    return;
  }

  try {
    if (isWeb) {
      // Web: use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        console.log(`[Storage] Stored ${key} in localStorage (length: ${value.length})`);
      }
    } else {
      // Native: use AsyncStorage
      await AsyncStorage.setItem(key, value);
      console.log(`[Storage] Stored ${key} in AsyncStorage (length: ${value.length})`);
    }
    
    // Also store in memory as backup
    memoryStorage.set(key, value);
    console.log(`[Storage] Also stored ${key} in memory`);
  } catch (error) {
    console.error(`[Storage] setItem FAILED for ${key}:`, error);
    // Fallback to memory
    memoryStorage.set(key, value);
    console.log(`[Storage] Stored ${key} in memory (as fallback)`);
  }
}

/**
 * Delete item from storage
 */
export async function deleteItem(key: string): Promise<void> {
  try {
    if (isWeb) {
      // Web: use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      // Native: use AsyncStorage
      await AsyncStorage.removeItem(key);
    }
    
    // Delete from memory
    memoryStorage.delete(key);
  } catch (error) {
    console.warn(`[Storage] deleteItem error for ${key}:`, error);
    memoryStorage.delete(key);
  }
}
