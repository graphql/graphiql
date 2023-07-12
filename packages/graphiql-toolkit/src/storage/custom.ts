/**
 * This function enables a custom namespace for localStorage
 */

import { Storage } from './base';

export type CreateLocalStorageOptions = {
  /**
   * specify a different storage namespace prefix from the default of 'graphiql'
   */
  namespace?: string;
};
/**
 * generate a custom local storage adapter for GraphiQL `storage` prop.
 */
export function createLocalStorage({
  namespace,
}: CreateLocalStorageOptions): Storage {
  const storageKeyPrefix = `${namespace}:`;
  const getStorageKey = (key: string) => `${storageKeyPrefix}${key}`;

  const storage: Storage = {
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

    clear() {
      // We only want to clear the namespaced items
      for (const key in window.localStorage) {
        if (key.indexOf(storageKeyPrefix) === 0) {
          window.localStorage.removeItem(key);
        }
      }
    },
  };

  return storage;
}
