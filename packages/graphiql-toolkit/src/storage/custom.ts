/**
 * This function enables a custom namespace for localStorage
 */

import { Storage } from './base';

export function createLocalStorage(namespace: string): Storage {
  // you can re-use storageKeyPrefix/storageKey in the methods below
  const storageKeyPrefix = `${namespace}:`;
  const getStorageKey = (key: string) => `${storageKeyPrefix}${key}`;

  const storage = {
    setItem: (key, value) => localStorage.setItem(getStorageKey(key), value),
    getItem: key => localStorage.getItem(getStorageKey(key)),
    removeItem: key => localStorage.removeItem(getStorageKey(key)),
    get length() {
      let keys = 0;
      for (const key in window.localStorage) {
        if (key.indexOf(storageKeyPrefix) === 0) {
          keys += 1;
        }
      }
      return keys;
    },

    clear: () => {
      // We only want to clear the namespaced items
      for (const key in window.localStorage) {
        if (key.indexOf(storageKeyPrefix) === 0) {
          window.localStorage.removeItem(key);
        }
      }
    },
  } as Storage;

  return storage;
}
