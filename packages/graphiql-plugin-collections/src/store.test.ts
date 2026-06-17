import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectionsStore } from './store';
import type { Collection, CollectionsStorage } from './types';
import { createLocalStorageAdapter } from './storage/local-storage';

const getActions = () => collectionsStore.getState().actions;

const makeStorage = (initial: Collection[] = []): CollectionsStorage => {
  let data = [...initial];
  return {
    async load() {
      return data;
    },
    async save(collections) {
      data = [...collections];
    },
  };
};

const initialState = {
  collections: [] as Collection[],
  loaded: false,
  storage: makeStorage(),
};

beforeEach(() => {
  collectionsStore.setState({
    ...initialState,
    storage: makeStorage(),
  });
});

describe('init', () => {
  it('loads collections from storage', async () => {
    const col: Collection = {
      id: 'col-1',
      name: 'Test',
      items: [],
      createdAt: 1000,
      updatedAt: 1000,
    };
    const storage = makeStorage([col]);
    await getActions().init(storage);
    expect(collectionsStore.getState().collections).toEqual([col]);
    expect(collectionsStore.getState().loaded).toBe(true);
  });
});

describe('createCollection', () => {
  it('adds a collection', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('My Queries', 'desc');
    expect(c.name).toBe('My Queries');
    expect(c.description).toBe('desc');
    expect(collectionsStore.getState().collections).toHaveLength(1);
    expect(collectionsStore.getState().collections[0]).toBe(c);
  });

  it('persists after create', async () => {
    const storage = makeStorage();
    const saveSpy = vi.spyOn(storage, 'save');
    await getActions().init(storage);
    getActions().createCollection('Test');
    // allow async persist to run
    await new Promise(r => setTimeout(r, 0));
    expect(saveSpy).toHaveBeenCalled();
  });
});

describe('deleteCollection', () => {
  it('removes a collection by id', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('To Delete');
    expect(collectionsStore.getState().collections).toHaveLength(1);
    getActions().deleteCollection(c.id);
    expect(collectionsStore.getState().collections).toHaveLength(0);
  });
});

describe('renameCollection', () => {
  it('changes the collection name', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('Old Name');
    getActions().renameCollection(c.id, 'New Name');
    const updated = collectionsStore.getState().collections[0];
    expect(updated?.name).toBe('New Name');
  });
});

describe('addItem', () => {
  it('adds an item to the correct collection', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('Queries');
    const item = getActions().addItem(c.id, {
      name: 'Get User',
      query: '{ user { id } }',
    });
    const col = collectionsStore
      .getState()
      .collections.find(x => x.id === c.id)!;
    expect(col.items).toHaveLength(1);
    expect(col.items[0]).toMatchObject({
      name: 'Get User',
      query: '{ user { id } }',
    });
    expect(item.id).toBeTruthy();
  });
});

describe('updateItem', () => {
  it('updates item fields', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('Queries');
    const item = getActions().addItem(c.id, { name: 'Old', query: '{ a }' });
    getActions().updateItem(c.id, item.id, { name: 'New', query: '{ b }' });
    const col = collectionsStore
      .getState()
      .collections.find(x => x.id === c.id)!;
    expect(col.items[0]).toMatchObject({ name: 'New', query: '{ b }' });
  });
});

describe('deleteItem', () => {
  it('removes an item from a collection', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('Queries');
    const item = getActions().addItem(c.id, { name: 'q1', query: '{ a }' });
    getActions().addItem(c.id, { name: 'q2', query: '{ b }' });
    getActions().deleteItem(c.id, item.id);
    const col = collectionsStore
      .getState()
      .collections.find(x => x.id === c.id)!;
    expect(col.items).toHaveLength(1);
    expect(col.items[0]?.name).toBe('q2');
  });
});

describe('moveItem', () => {
  it('reorders within the same collection', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('Queries');
    getActions().addItem(c.id, { name: 'a', query: '{ a }' });
    getActions().addItem(c.id, { name: 'b', query: '{ b }' });
    getActions().addItem(c.id, { name: 'c', query: '{ c }' });
    getActions().moveItem(c.id, 0, c.id, 2);
    const col = collectionsStore
      .getState()
      .collections.find(x => x.id === c.id)!;
    expect(col.items.map(i => i.name)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item between different collections', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c1 = getActions().createCollection('C1');
    const c2 = getActions().createCollection('C2');
    const item = getActions().addItem(c1.id, { name: 'item', query: '{ x }' });
    getActions().moveItem(c1.id, 0, c2.id, 0);
    const col1 = collectionsStore
      .getState()
      .collections.find(x => x.id === c1.id)!;
    const col2 = collectionsStore
      .getState()
      .collections.find(x => x.id === c2.id)!;
    expect(col1.items).toHaveLength(0);
    expect(col2.items).toHaveLength(1);
    expect(col2.items[0]?.name).toBe(item.name);
  });

  it('does nothing for an out-of-bounds index', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('C1');
    getActions().addItem(c.id, { name: 'a', query: '{ a }' });
    const before = collectionsStore.getState().collections[0]?.items.length;
    getActions().moveItem(c.id, 5, c.id, 0);
    const after = collectionsStore.getState().collections[0]?.items.length;
    expect(before).toBe(after);
  });
});

describe('exportCollections', () => {
  it('returns valid JSON with version=1', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    getActions().createCollection('Test');
    const exported = getActions().exportCollections();
    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.collections)).toBe(true);
    expect(parsed.collections[0]?.name).toBe('Test');
  });
});

describe('importCollections', () => {
  it('merge mode appends without duplicating by id', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const c = getActions().createCollection('Existing');
    const toImport = JSON.stringify({
      version: 1,
      collections: [
        { id: c.id, name: 'Duplicate', items: [], createdAt: 0, updatedAt: 0 },
        { id: 'new-id', name: 'New', items: [], createdAt: 0, updatedAt: 0 },
      ],
    });
    getActions().importCollections(toImport, 'merge');
    const state = collectionsStore.getState().collections;
    expect(state).toHaveLength(2);
    // existing kept, duplicate skipped, new added
    expect(state.find(c2 => c2.id === c.id)?.name).toBe('Existing');
    expect(state.find(c2 => c2.id === 'new-id')?.name).toBe('New');
  });

  it('replace mode replaces all collections', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    getActions().createCollection('Will be replaced');
    const replacement = JSON.stringify({
      collections: [
        {
          id: 'imported-1',
          name: 'Imported',
          items: [],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    });
    getActions().importCollections(replacement, 'replace');
    const state = collectionsStore.getState().collections;
    expect(state).toHaveLength(1);
    expect(state[0]?.name).toBe('Imported');
  });

  it('does nothing on invalid JSON', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    getActions().createCollection('Keep me');
    getActions().importCollections('not valid json', 'replace');
    expect(collectionsStore.getState().collections).toHaveLength(1);
  });
});

describe('persistence round-trip', () => {
  it('save then load restores data', async () => {
    let persisted: Collection[] = [];
    const storage: CollectionsStorage = {
      async load() {
        return persisted;
      },
      async save(cols) {
        persisted = [...cols];
      },
    };
    await getActions().init(storage);
    getActions().createCollection('Persistent');
    // allow persist
    await new Promise(r => setTimeout(r, 0));
    // Reset and reload
    collectionsStore.setState({ collections: [], loaded: false, storage });
    await getActions().init(storage);
    expect(collectionsStore.getState().collections[0]?.name).toBe('Persistent');
  });
});

describe('createLocalStorageAdapter', () => {
  it('version mismatch logs warning but preserves data', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const key = 'test-collections-key';
    // Store with version 99
    window.localStorage.setItem(
      key,
      JSON.stringify({
        version: 99,
        collections: [
          { id: 'x', name: 'Saved', items: [], createdAt: 0, updatedAt: 0 },
        ],
      }),
    );
    const adapter = createLocalStorageAdapter(key);
    const result = await adapter.load();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Saved');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('version mismatch'),
    );
    warnSpy.mockRestore();
    window.localStorage.removeItem(key);
  });
});
