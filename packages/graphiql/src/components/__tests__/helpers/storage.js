export function getMockStorage() {
  return (function() {
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
      get(key) {
        return store.hasOwnProperty(key) ? store[key] : null;
      },
      set(key, value) {
        store[key] = value.toString();
      },
    };
  })();
}
