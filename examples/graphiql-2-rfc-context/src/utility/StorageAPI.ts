/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

export interface Storage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
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

export default class StorageAPI {
  storage: Storage | null;

  constructor(storage?: Storage) {
    this.storage =
      storage || (typeof window !== 'undefined' ? window.localStorage : null);
  }

  get(name: string): string | null {
    if (this.storage) {
      const value = this.storage.getItem('graphiql:' + name);
      // Clean up any inadvertently saved null/undefined values.
      if (value === 'null' || value === 'undefined') {
        this.storage.removeItem('graphiql:' + name);
        return null;
      }

      if (value) {
        return value;
      }
    }
    return null;
  }

  set(name: string, value: string) {
    let quotaError = false;
    let error = null;

    if (this.storage) {
      const key = `graphiql:${name}`;
      if (value) {
        try {
          this.storage.setItem(key, value);
        } catch (e) {
          error = e;
          quotaError = isQuotaError(this.storage, e);
        }
      } else {
        // Clean up by removing the item if there's no value to set
        this.storage.removeItem(key);
      }
    }

    return {
      isQuotaError: quotaError,
      error,
    };
  }
}
