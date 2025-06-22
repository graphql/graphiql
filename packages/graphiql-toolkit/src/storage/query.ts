import type { StateStorage } from 'zustand/middleware';

export type QueryStoreItem = {
  query?: string;
  variables?: string;
  headers?: string;
  operationName?: string;
  label?: string;
  favorite?: boolean;
};

export class QueryStore {
  items: QueryStoreItem[] = [];

  constructor(
    private key: string,
    private storage: StateStorage,
    private maxSize: number | null = null,
  ) {
    void this.fetchAll().then(items => {
      this.items = items;
    });
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

  edit(item: QueryStoreItem, index?: number) {
    if (typeof index === 'number' && this.items[index]) {
      const found = this.items[index];
      if (
        found.query === item.query &&
        found.variables === item.variables &&
        found.headers === item.headers &&
        found.operationName === item.operationName
      ) {
        this.items.splice(index, 1, item);
        this.save();
        return;
      }
    }

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
    return this.items.at(-1);
  }

  async fetchAll() {
    const raw = await this.storage.getItem(this.key);
    if (raw) {
      return raw;
    }
    return [];
  }

  push(item: QueryStoreItem) {
    const items = [...this.items, item];

    if (this.maxSize && items.length > this.maxSize) {
      items.shift();
    }
    this.storage.setItem(this.key, this.items);
  }

  save() {
    this.storage.setItem(this.key, this.items);
  }
}
