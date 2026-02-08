// Import expo-sqlite localStorage polyfill for React Native
import "expo-sqlite/localStorage/install";

/**
 * Storage adapter that provides AsyncStorage-compatible API using localStorage polyfill.
 * Uses expo-sqlite/localStorage polyfill on native, native localStorage on web.
 */
export const storageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error("Error getting all keys:", error);
      return [];
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      const results: [string, string | null][] = [];
      for (const key of keys) {
        const value = await this.getItem(key);
        results.push([key, value]);
      }
      return results;
    } catch (error) {
      console.error("Error in multiGet:", error);
      return keys.map((key) => [key, null]);
    }
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      for (const [key, value] of keyValuePairs) {
        await this.setItem(key, value);
      }
    } catch (error) {
      console.error("Error in multiSet:", error);
      throw error;
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      for (const key of keys) {
        await this.removeItem(key);
      }
    } catch (error) {
      console.error("Error in multiRemove:", error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  },
};
