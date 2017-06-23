export default class QueryStore {
  constructor(key, storage) {
    this.key = key;
    this.storage = storage;
    this.items = this.fetchAll();
  }

  get length() {
    return this.items.length;
  }

  contains(item) {
    return this.items.some(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.operationName === item.operationName,
    );
  }

  delete(item) {
    const index = this.items.findIndex(
      x =>
        x.query === item.query &&
        x.variables === item.variables &&
        x.operationName === item.operationName,
    );
    if (index !== -1) {
      this.items.splice(index, 1);
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

  push(item) {
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
