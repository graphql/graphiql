export default class LocalStore {
  constructor(key) {
    this.key = key;
    this.items = this.fetchAll();
  }

  get length() {
    return this.items.length;
  }

  fetchRecent() {
    return this.items[this.items.length - 1];
  }

  fetchAll() {
    const raw = localStorage.getItem(`graphiql:${this.key}`);
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
    const payload = JSON.stringify({[this.key]: this.items});
    localStorage.setItem(`graphiql:${this.key}`, payload);
  }
}
