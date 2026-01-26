/**
 * LocalStorage wrapper with type safety
 */

const STORAGE_PREFIX = 'proctor_';

export const storage = {
  /**
   * Set item in localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(STORAGE_PREFIX + key, serialized);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  /**
   * Get item from localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  /**
   * Clear all items with prefix
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

/**
 * SessionStorage wrapper (for temporary data within tab)
 */
export const sessionStorage = {
  /**
   * Set item in sessionStorage
   */
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      window.sessionStorage.setItem(STORAGE_PREFIX + key, serialized);
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  },

  /**
   * Get item from sessionStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = window.sessionStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  },

  /**
   * Remove item from sessionStorage
   */
  remove(key: string): void {
    try {
      window.sessionStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  },

  /**
   * Clear all sessionStorage items with prefix
   */
  clear(): void {
    try {
      const keys = Object.keys(window.sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  },
};

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  STUDENT: 'student',
  SESSION_ID: 'session_id',
  EXAM_DATA: 'exam_data',
  RESPONSES: 'responses',
  CURRENT_QUESTION: 'current_question',
  VIOLATIONS: 'violations',
} as const;
