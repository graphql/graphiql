export interface LocalStorage {
  getItem: (key: string) => any;
  removeItem: (key: string) => undefined;
  setItem: (key: string, value: any) => undefined;
  length: number;
}

/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
export default class StorageAPI {
  storage: LocalStorage;
  constructor(storage: LocalStorage) {
    this.storage = storage || window.localStorage;
  }
  get(name: string) {
    if (this.storage) {
      const value = this.storage.getItem('graphiql:' + name);
      // Clean up any inadvertently saved null/undefined values.
      if (value === 'null' || value === 'undefined') {
        this.storage.removeItem('graphiql:' + name);
      } else {
        return value;
      }
    }
  }
  set(name: string, value: any) {
    if (this.storage) {
      const key = `graphiql:${name}`;
      if (value) {
        if (isStorageAvailable(this.storage, key, value)) {
          this.storage.setItem(key, value);
        }
      } else {
        // Clean up by removing the item if there's no value to set
        this.storage.removeItem(key);
      }
    }
  }
}

function isStorageAvailable(storage: LocalStorage, key: string, value: any) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
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
}
