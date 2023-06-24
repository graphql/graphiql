/**
 * This describes the attributes and methods that a store has to support in
 * order to be used with GraphiQL. It closely resembles the `localStorage`
 * API as it is the default storage used in GraphiQL.
 */
export type Storage = {
  /**
   * Retrieve an item from the store by its key.
   * @param key The key of the item to retrieve.
   * @returns {?string} The stored value for the given key if it exists, `null`
   * otherwise.
   */
  getItem(key: string): string | null;
  /**
   * Add a value to the store for a given key. If there already exists a value
   * for the given key, this method will override the value.
   * @param key The key to store the value for.
   * @param value The value to store.
   */
  setItem(key: string, value: string): void;
  /**
   * Remove the value for a given key from the store. If there is no value for
   * the given key this method does nothing.
   * @param key The key to remove the value from the store.
   */
  removeItem(key: string): void;
  /**
   * Remove all items from the store.
   */
  clear(): void;
  /**
   * The number of items that are currently stored.
   */
  length: number;
};

function isQuotaError(storage: Storage, e: unknown) {
  return (
    e instanceof DOMException &&
    // everything except Firefox
    (e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
    // acknowledge QuotaExceededError only if there's something already stored
    storage.length !== 0
  );
}

export class StorageAPI {
  storage: Storage | null;

  constructor(storage?: Storage | null) {
    if (storage) {
      this.storage = storage;
    } else if (storage === null) {
      // Passing `null` creates a noop storage
      this.storage = null;
    } else if (typeof window === 'undefined') {
      this.storage = null;
    } else {
      this.storage = {
        getItem: window.localStorage.getItem.bind(window.localStorage),
        setItem: window.localStorage.setItem.bind(window.localStorage),
        removeItem: window.localStorage.removeItem.bind(window.localStorage),

        get length() {
          let keys = 0;
          for (const key in window.localStorage) {
            if (key.indexOf(`${STORAGE_NAMESPACE}:`) === 0) {
              keys += 1;
            }
          }
          return keys;
        },

        clear() {
          // We only want to clear the namespaced items
          for (const key in window.localStorage) {
            if (key.indexOf(`${STORAGE_NAMESPACE}:`) === 0) {
              window.localStorage.removeItem(key);
            }
          }
        },
      };
    }
  }

  get(name: string): string | null {
    if (!this.storage) {
      return null;
    }

    const key = `${STORAGE_NAMESPACE}:${name}`;
    const value = this.storage.getItem(key);
    // Clean up any inadvertently saved null/undefined values.
    if (value === 'null' || value === 'undefined') {
      this.storage.removeItem(key);
      return null;
    }

    return value || null;
  }

  set(
    name: string,
    value: string,
  ): { isQuotaError: boolean; error: Error | null } {
    let quotaError = false;
    let error: Error | null = null;

    if (this.storage) {
      const key = `${STORAGE_NAMESPACE}:${name}`;
      if (value) {
        try {
          this.storage.setItem(key, value);
        } catch (e) {
          error = e instanceof Error ? e : new Error(`${e}`);
          quotaError = isQuotaError(this.storage, e);
        }
      } else {
        // Clean up by removing the item if there's no value to set
        this.storage.removeItem(key);
      }
    }

    return { isQuotaError: quotaError, error };
  }

  clear() {
    if (this.storage) {
      this.storage.clear();
    }
  }
}

const STORAGE_NAMESPACE = 'graphiql';
