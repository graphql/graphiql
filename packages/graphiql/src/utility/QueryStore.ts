import StorageAPI from './StorageAPI';

type GraphQLQueryItem = {
  query: string;
  variables: any;
  operationName: string;
};

export default class QueryStore {
  items: GraphQLQueryItem[];
  storage: StorageAPI;
  key: string;

  constructor(key: string, storage: StorageAPI) {
    this.key = key;
    this.storage = storage;
    this.items = this.fetchAll();
  }

  get length() {
    return this.items.length;
  }

  contains(item: GraphQLQueryItem) {
    return this.items.some(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.operationName === item.operationName,
    );
  }

  edit(item: GraphQLQueryItem) {
    const itemIndex = this.items.findIndex(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.operationName === item.operationName,
    );
    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1, item);
      this.save();
    }
  }

  delete(item: GraphQLQueryItem) {
    const itemIndex = this.items.findIndex(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
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
      return JSON.parse(raw)[this.key];
    }
    return [];
  }

  push(item: GraphQLQueryItem) {
    this.items.push(item);
    this.save();
  }

  shift() {
    this.items.shift();
    this.save();
  }

  save() {
    this.storage.set(this.key, JSON.stringify({ [this.key]: this.items }));
  }
}
