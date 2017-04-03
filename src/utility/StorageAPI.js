export default class StorageAPI {
  constructor(storage) {
    this.storage = storage || window.localStorage;
  }

  get(name) {
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

  set(name, value) {
    if (this.storage) {
      if (value) {
        this.storage.setItem('graphiql:' + name, value);
      } else {
        this.storage.removeItem('graphiql:' + name);
      }
    }
  }
}
