
const DEFAULT_NAMPESPACE = 'graphiql'

export interface Storage {
  getItem: <T>(key: string) => Promise<T | string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: <T>(key: string, value: T | string) => Promise<void>;
  length: number;
}

function isQuotaError(storage: Storage, e: Error) {
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

function getLocalForage(namespace: string): Storage {
  const localforage = require('localforage')
  localforage.config({ name: namespace })
  return localforage
}

export class StorageAPI {
  storage: Storage | null;
  namespace: string;

  constructor(namespace: string = DEFAULT_NAMPESPACE, storage?: Storage) {

    this.namespace = namespace
    this.storage = storage || getLocalForage(namespace)
  }

  async get<T>(name: string): Promise<T | string | null> {
    if (this.storage) {
      const value = await this.storage.getItem<T>(name);
      // Clean up any inadvertently saved null/undefined values.
      if (value === 'null' || value === 'undefined') {
        await this.storage.removeItem(name);
        return null;
      }

      if (value) {
        return value;
      }
    }
    return null;
  }

  async set<T>(name: string, value: T | string) {
    let quotaError = false;
    let error = null;

    if (this.storage) {
      if (value) {
        try {
          await this.storage.setItem<T>(name, value);
        } catch (e) {
          error = e;
          quotaError = isQuotaError(this.storage, e);
        }
      } else {
        // Clean up by removing the item if there's no value to set
        await this.storage.removeItem(name);
      }
    }

    return {
      isQuotaError: quotaError,
      error,
    };
  }
}
