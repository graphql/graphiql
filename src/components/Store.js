export default class Store {
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
    localStorage.setItem(`graphiql:${this.key}`, JSON.stringify({[this.key]: this.items}));
  }
}
