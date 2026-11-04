import { describe, it, expect } from 'vitest';
import { StorageAPI } from '../base';
import { HistoryStore } from '../history';

function createStorage() {
  const map = new Map<string, string>();
  return new StorageAPI({
    getItem(key) {
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
    get length() {
      return map.size;
    },
  });
}

describe('HistoryStore', () => {
  describe('updateHistory', () => {
    const query = 'query GetUser { user { id } } mutation UpdateUser { id }';

    it('records the type of the executed operation', () => {
      const store = new HistoryStore(createStorage(), 20);
      store.updateHistory({ query, operationName: 'UpdateUser' });
      expect(store.history.items[0]?.operation).toBe('mutation');
    });

    it('falls back to the first operation when no name matches', () => {
      const store = new HistoryStore(createStorage(), 20);
      store.updateHistory({ query });
      expect(store.history.items[0]?.operation).toBe('query');
    });
  });
});
