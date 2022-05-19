export type Storage = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
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
    } else {
      // When passing `undefined` we default to localStorage
      this.storage = typeof window !== 'undefined' ? window.localStorage : null;
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
}

const STORAGE_NAMESPACE = 'graphiql';
