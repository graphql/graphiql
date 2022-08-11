/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import StorageAPI from './StorageAPI';

export type QueryStoreItem = {
  query?: string;
  variables?: string;
  headers?: string;
  operationName?: string;
  label?: string;
  favorite?: boolean;
};

export default class QueryStore {
  items: Array<QueryStoreItem>;

  constructor(
    private key: string,
    private storage: StorageAPI,
    private maxSize: number | null = null,
  ) {
    this.items = this.fetchAll();
  }

  get length() {
    return this.items.length;
  }

  contains(item: QueryStoreItem) {
    return this.items.some(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.headers === item.headers &&
        x.operationName === item.operationName,
    );
  }

  edit(item: QueryStoreItem) {
    const itemIndex = this.items.findIndex(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.headers === item.headers &&
        x.operationName === item.operationName,
    );
    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1, item);
      this.save();
    }
  }

  delete(item: QueryStoreItem) {
    const itemIndex = this.items.findIndex(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.headers === item.headers &&
        x.operationName === item.operationName,
    );
    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
      this.save();
    }
  }

  fetchRecent() {
    return this.items[this.items.length - 1];
  }

  fetchAll() {
    const raw = this.storage.get(this.key);
    if (raw) {
      return JSON.parse(raw)[this.key] as Array<QueryStoreItem>;
    }
    return [];
  }

  push(item: QueryStoreItem) {
    const items = [...this.items, item];

    if (this.maxSize && items.length > this.maxSize) {
      items.shift();
    }

    for (let attempts = 0; attempts < 5; attempts++) {
      const response = this.storage.set(
        this.key,
        JSON.stringify({ [this.key]: items }),
      );
      if (!response || !response.error) {
        this.items = items;
      } else if (response.isQuotaError && this.maxSize) {
        // Only try to delete last items on LRU stores
        items.shift();
      } else {
        return; // We don't know what happened in this case, so just bailing out
      }
    }
  }

  save() {
    this.storage.set(this.key, JSON.stringify({ [this.key]: this.items }));
  }
}
