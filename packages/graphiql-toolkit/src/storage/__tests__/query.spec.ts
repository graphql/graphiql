import { StorageAPI } from '../base';
import { QueryStore } from '../query';

class StorageMock {
  shouldThrow: () => boolean;
  count: number;
  map = {};
  storage: Storage;
  constructor(shouldThrow: () => boolean) {
    this.shouldThrow = shouldThrow;
  }

  set(key: string, value: string) {
    this.count++;

    if (this.shouldThrow()) {
      return {
        error: new Error('boom'),
        isQuotaError: true,
      };
    }

    this.map[key] = value;

    return {
      error: null,
      isQuotaError: false,
    };
  }

  get(key: string) {
    return this.map[key] || null;
  }
}

describe('QueryStore', () => {
  describe('with no max items', () => {
    it('can push multiple items', () => {
      const store = new QueryStore('normal', new StorageAPI());

      for (let i = 0; i < 100; i++) {
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(100);
    });

    it('will fail silently on quota error', () => {
      let i = 0;
      const store = new QueryStore('normal', new StorageMock(() => i > 4));

      for (; i < 10; i++) {
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(5);
      expect(store.items[0].query).toBe('item0');
      expect(store.items[4].query).toBe('item4');
    });
  });

  describe('with max items', () => {
    it('can push a limited number of items', () => {
      const store = new QueryStore('limited', new StorageAPI(), 20);

      for (let i = 0; i < 100; i++) {
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(20);
      // keeps the more recent items
      expect(store.items[0].query).toBe('item80');
      expect(store.items[19].query).toBe('item99');
    });

    it('tries to remove on quota error until it succeeds', () => {
      let shouldThrow: () => boolean;
      let retryCounter = 0;
      const store = new QueryStore(
        'normal',
        new StorageMock(() => {
          retryCounter++;
          return shouldThrow();
        }),
        10,
      );

      for (let i = 0; i < 20; i++) {
        shouldThrow = () => false;
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(10);
      // keeps the more recent items
      expect(store.items[0].query).toBe('item10');
      expect(store.items[9].query).toBe('item19');

      // tries to add an item, succeeds on 3rd try
      retryCounter = 0;
      shouldThrow = () => retryCounter < 3;
      store.push({ query: 'finalItem' });

      expect(store.items.length).toBe(8);
      expect(store.items[0].query).toBe('item13');
      expect(store.items[7].query).toBe('finalItem');
    });

    it('tries to remove a maximum of 5 times', () => {
      let shouldThrow: () => boolean;
      let retryCounter = 0;
      const store = new QueryStore(
        'normal',
        new StorageMock(() => {
          retryCounter++;
          return shouldThrow();
        }),
        10,
      );

      for (let i = 0; i < 20; i++) {
        shouldThrow = () => false;
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(10);
      // keeps the more recent items
      expect(store.items[0].query).toBe('item10');
      expect(store.items[9].query).toBe('item19');

      // tries to add an item, keeps failing
      retryCounter = 0;
      shouldThrow = () => true;
      store.push({ query: 'finalItem' });

      expect(store.items.length).toBe(10);
      // kept the items
      expect(store.items[0].query).toBe('item10');
      expect(store.items[9].query).toBe('item19');
      // retried 5 times
      expect(retryCounter).toBe(5);
    });
  });
});
