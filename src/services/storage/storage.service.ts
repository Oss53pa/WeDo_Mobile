/**
 * Storage Service
 * Secure local storage using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store a value in AsyncStorage
 */
export const setItem = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error storing item with key "${key}":`, error);
    throw error;
  }
};

/**
 * Get a value from AsyncStorage
 */
export const getItem = async <T = any>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error retrieving item with key "${key}":`, error);
    return null;
  }
};

/**
 * Remove a value from AsyncStorage
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item with key "${key}":`, error);
    throw error;
  }
};

/**
 * Clear all data from AsyncStorage
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
    throw error;
  }
};

/**
 * Get all keys from AsyncStorage
 */
export const getAllKeys = async (): Promise<string[]> => {
  try {
    return [...(await AsyncStorage.getAllKeys())];
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};

/**
 * Store multiple items
 */
export const multiSet = async (keyValuePairs: Array<[string, any]>): Promise<void> => {
  try {
    const pairs = keyValuePairs.map(([key, value]) => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(pairs as [string, string][]);
  } catch (error) {
    console.error('Error storing multiple items:', error);
    throw error;
  }
};

/**
 * Get multiple items
 */
export const multiGet = async <T = any>(keys: string[]): Promise<{[key: string]: T}> => {
  try {
    const result = await AsyncStorage.multiGet(keys);
    const data: {[key: string]: T} = {};

    result.forEach(([key, value]) => {
      if (value) {
        data[key] = JSON.parse(value);
      }
    });

    return data;
  } catch (error) {
    console.error('Error retrieving multiple items:', error);
    return {};
  }
};

/**
 * Remove multiple items
 */
export const multiRemove = async (keys: string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error removing multiple items:', error);
    throw error;
  }
};

export default {
  setItem,
  getItem,
  removeItem,
  clearAll,
  getAllKeys,
  multiSet,
  multiGet,
  multiRemove,
};
