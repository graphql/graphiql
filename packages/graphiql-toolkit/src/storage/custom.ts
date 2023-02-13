/**
 * This function enables a custom namespace for localStorage
 */

import { Storage } from './base';

export function createLocalStorage(namespace: string): Storage {
  const storage = {
    setItem: (key, value) => localStorage.setItem(`${namespace}:${key}`, value),
    getItem: key => localStorage.getItem(`${namespace}:${key}`),
    removeItem: key => localStorage.removeItem(`${namespace}:${key}`),
    get length() {
      let keys = 0;
      for (const key in window.localStorage) {
        if (key.indexOf(`${namespace}:`) === 0) {
          keys += 1;
        }
      }
      return keys;
    },

    clear: () => {
      // We only want to clear the namespaced items
      for (const key in window.localStorage) {
        if (key.indexOf(`${namespace}:`) === 0) {
          window.localStorage.removeItem(key);
        }
      }
    },
  } as Storage;

  return storage;
}
