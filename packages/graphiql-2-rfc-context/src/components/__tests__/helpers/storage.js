export function getMockStorage() {
  let store = {};
  return {
    getItem(key) {
      return store.hasOwnProperty(key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
    removeItem(key) {
      if (store.hasOwnProperty(key)) {
        const updatedStore = {};
        for (const k in store) {
          if (k !== key) {
            updatedStore[k] = store[k];
          }
        }
        store = updatedStore;
      }
    },
  };
}
