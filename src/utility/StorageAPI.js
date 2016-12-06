export default class StorageAPI {
  constructor(storage) {
    this.storage = storage || window.localStorage;
  }

  get(name) {
    return this.storage && this.storage.getItem('graphiql:' + name);
  }

  set(name, value) {
    if (this.storage) {
      this.storage.setItem('graphiql:' + name, value);
    }
  }
}
