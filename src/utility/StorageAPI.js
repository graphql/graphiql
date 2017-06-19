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
        return trySetItem('graphiql:' + name, value);
      }
      // Clean up by removing the item if there's no value to set
      this.storage.removeItem('graphiql:' + name);
    }
    return true;
  }
}

function trySetItem(key, value, storage) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0;
  }
}
