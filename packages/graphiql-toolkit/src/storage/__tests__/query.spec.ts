import { QueryStore } from '../query';
import { createJSONStorage } from 'zustand/middleware';

class StorageMock {
  shouldThrow: () => boolean;
  // @ts-expect-error
  count: number;
  map: Record<string, string> = {};
  // @ts-expect-error
  storage: Storage;

  constructor(shouldThrow: () => boolean) {
    this.shouldThrow = shouldThrow;
  }

  setItem(key: string, value: string) {
    this.count++;
    if (this.shouldThrow()) {
      throw new Error('boom');
    }
    this.map[key] = value;
  }

  getItem(key: string) {
    return this.map[key] || null;
  }
}

describe('QueryStore', () => {
  const storage = createJSONStorage(() => localStorage);

  describe('with no max items', () => {
    it('can push multiple items', async () => {
      // @ts-expect-error -- fixme
      const store = await QueryStore.create('normal', storage);

      for (let i = 0; i < 100; i++) {
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(100);
    });

    it('will fail silently on quota error', async () => {
      let i = 0;
      const store = await QueryStore.create(
        'normal',
        // @ts-expect-error
        new StorageMock(() => i > 4),
      );

      for (; i < 10; i++) {
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(5);
      expect(store.items[0].query).toBe('item0');
      expect(store.items[4].query).toBe('item4');
    });
  });

  describe('with max items', () => {
    it('can push a limited number of items', async () => {
      // @ts-expect-error -- fixme
      const store = await QueryStore.create('limited', storage, 20);

      for (let i = 0; i < 100; i++) {
        store.push({ query: `item${i}` });
      }

      expect(store.items.length).toBe(20);
      // keeps the more recent items
      expect(store.items[0].query).toBe('item80');
      expect(store.items[19].query).toBe('item99');
    });

    it('tries to remove on quota error until it succeeds', async () => {
      let shouldThrow: () => boolean;
      let retryCounter = 0;
      const store = await QueryStore.create(
        'normal',
        // @ts-expect-error
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

    it('tries to remove a maximum of 5 times', async () => {
      let shouldThrow: () => boolean;
      let retryCounter = 0;
      const store = new QueryStore(
        'normal',
        // @ts-expect-error
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
