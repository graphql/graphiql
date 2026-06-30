import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectionsStore } from './store';
import type { Collection, CollectionItem, CollectionsStorage } from './types';
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
    links: {},
    saveDialog: {
      open: false,
      query: '',
      variables: '',
      headers: '',
      name: '',
    },
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

describe('setCollections', () => {
  it('replaces the in-memory collections', () => {
    const col = makeCol('c1', 'Alpha');
    getActions().setCollections([col]);
    expect(collectionsStore.getState().collections).toEqual([col]);
  });

  it('does not call storage.save', async () => {
    const storage = makeStorage();
    const saveSpy = vi.spyOn(storage, 'save');
    await getActions().init(storage);
    getActions().setCollections([makeCol('c1', 'Alpha')]);
    await new Promise(r => setTimeout(r, 0));
    expect(saveSpy).not.toHaveBeenCalled();
  });
});

describe('reload', () => {
  it('re-reads from storage and updates state', async () => {
    let callCount = 0;
    const colV1 = makeCol('c1', 'V1');
    const colV2 = makeCol('c1', 'V2');
    const storage: CollectionsStorage = {
      async load() {
        callCount++;
        return callCount === 1 ? [colV1] : [colV2];
      },
      async save() {},
    };
    await getActions().init(storage);
    expect(collectionsStore.getState().collections[0]?.name).toBe('V1');
    await getActions().reload();
    expect(collectionsStore.getState().collections[0]?.name).toBe('V2');
  });

  it('calls storage.load and does not call storage.save', async () => {
    const storage = makeStorage([makeCol('c1', 'Alpha')]);
    const loadSpy = vi.spyOn(storage, 'load');
    const saveSpy = vi.spyOn(storage, 'save');
    await getActions().init(storage);
    loadSpy.mockClear(); // clear the init call
    await getActions().reload();
    expect(loadSpy).toHaveBeenCalledOnce();
    await new Promise(r => setTimeout(r, 0));
    expect(saveSpy).not.toHaveBeenCalled();
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

describe('exportCollection', () => {
  it('exports a single collection as a one-collection envelope', () => {
    const a = getActions().createCollection('Alpha');
    getActions().createCollection('Beta');
    const parsed = JSON.parse(getActions().exportCollection(a.id));
    expect(parsed.version).toBe(1);
    expect(parsed.collections).toHaveLength(1);
    expect(parsed.collections[0]?.name).toBe('Alpha');
  });

  it('exports an empty envelope for an unknown id', () => {
    const parsed = JSON.parse(getActions().exportCollection('nope'));
    expect(parsed.collections).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Helpers shared across analyzeImport / applyImport tests
// ---------------------------------------------------------------------------

const makeItem = (
  overrides: Partial<CollectionItem> & {
    id: string;
    name: string;
    query: string;
  },
): CollectionItem => ({
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

const makeCol = (
  id: string,
  name: string,
  items: CollectionItem[] = [],
): Collection => ({
  id,
  name,
  items,
  createdAt: 1000,
  updatedAt: 1000,
});

describe('analyzeImport', () => {
  it('returns ok:false for invalid JSON', () => {
    const result = getActions().analyzeImport('not valid json{{');
    expect(result.ok).toBe(false);
    expect(result.newCollections).toHaveLength(0);
    expect(result.newItems).toHaveLength(0);
    expect(result.changedItems).toHaveLength(0);
    expect(result.unchangedCount).toBe(0);
  });

  it('returns ok:false for valid JSON with no collections', () => {
    const result = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [] }),
    );
    expect(result.ok).toBe(false);
  });

  it('accepts a bare array as input', () => {
    const col = makeCol('c1', 'C1');
    const result = getActions().analyzeImport(JSON.stringify([col]));
    expect(result.ok).toBe(true);
    expect(result.newCollections).toHaveLength(1);
  });

  it('idempotent round-trip: everything unchanged, no new/changed items', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('My Queries');
    getActions().addItem(col.id, { name: 'Foo', query: '{ foo }' });

    const exported = getActions().exportCollections();
    const analysis = getActions().analyzeImport(exported);

    expect(analysis.ok).toBe(true);
    expect(analysis.newCollections).toHaveLength(0);
    expect(analysis.newItems).toHaveLength(0);
    expect(analysis.changedItems).toHaveLength(0);
    expect(analysis.unchangedCount).toBe(1);
  });

  it('classifies a new collection and its items as new', () => {
    const item = makeItem({ id: 'item-1', name: 'Op', query: '{ a }' });
    const col = makeCol('col-new', 'New Col', [item]);
    const result = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [col] }),
    );

    expect(result.ok).toBe(true);
    expect(result.newCollections).toHaveLength(1);
    expect(result.newCollections[0]?.id).toBe('col-new');
    expect(result.newCollections[0]?.items).toHaveLength(0); // shell only
    expect(result.newItems).toHaveLength(1);
    expect(result.newItems[0]?.item.id).toBe('item-1');
    expect(result.newItems[0]?.targetCollectionId).toBe('col-new');
  });

  it('classifies an existing item with changed content as a changedItem', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('My Col');
    const item = getActions().addItem(col.id, { name: 'Op', query: '{ old }' });

    const incoming = makeCol(col.id, col.name, [
      makeItem({ id: item.id, name: 'Op', query: '{ new }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );

    expect(analysis.changedItems).toHaveLength(1);
    expect(analysis.changedItems[0]?.incoming.query).toBe('{ new }');
    expect(analysis.changedItems[0]?.current.query).toBe('{ old }');
    expect(analysis.changedItems[0]?.currentCollectionId).toBe(col.id);
    expect(analysis.newItems).toHaveLength(0);
    expect(analysis.unchangedCount).toBe(0);
  });

  it('tracks currentCollectionId as where the recipient keeps the item, not the incoming parent', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    // Item lives in col-D after recipient moved it there.
    const colK = getActions().createCollection('K');
    const colD = getActions().createCollection('D');
    const item = getActions().addItem(colK.id, { name: 'X', query: '{ x }' });
    // Simulate recipient moving it to D.
    getActions().moveItem(colK.id, 0, colD.id, 0);

    // Import comes in with the item still in K (with changed content).
    const incoming = makeCol(colK.id, 'K', [
      makeItem({ id: item.id, name: 'X', query: '{ x changed }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );

    expect(analysis.changedItems).toHaveLength(1);
    expect(analysis.changedItems[0]?.currentCollectionId).toBe(colD.id);
  });

  it('collection metadata is not overridden when collection id already exists', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Local Name');

    // Import with same id but different name — newCollections should be empty.
    const incoming = makeCol(col.id, 'Incoming Name', []);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );

    expect(analysis.newCollections).toHaveLength(0);
  });
});

describe('applyImport', () => {
  it('apply of ok:false analysis is a no-op', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    getActions().createCollection('Keep me');
    const bad = getActions().analyzeImport('garbage!!');
    getActions().applyImport(bad, { mode: 'merge', applyChanges: true });
    expect(collectionsStore.getState().collections).toHaveLength(1);
  });

  it('replace mode replaces all collections', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    getActions().createCollection('Will be replaced');
    const replacement = JSON.stringify({
      collections: [makeCol('imported-1', 'Imported')],
    });
    const analysis = getActions().analyzeImport(replacement);
    getActions().applyImport(analysis, { mode: 'replace' });
    const state = collectionsStore.getState().collections;
    expect(state).toHaveLength(1);
    expect(state[0]?.name).toBe('Imported');
  });

  it('replace mode preserves the items in the replacement', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    getActions().createCollection('Will be replaced');
    const incoming = makeCol('imported-1', 'Imported', [
      makeItem({ id: 'op-1', name: 'Op One', query: '{ a }' }),
      makeItem({ id: 'op-2', name: 'Op Two', query: '{ b }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    getActions().applyImport(analysis, { mode: 'replace' });
    const state = collectionsStore.getState().collections;
    expect(state).toHaveLength(1);
    expect(state[0]?.items.map(i => i.id)).toEqual(['op-1', 'op-2']);
  });

  it('idempotent apply is a no-op — no duplicates', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('My Queries');
    getActions().addItem(col.id, { name: 'Foo', query: '{ foo }' });
    const before = collectionsStore.getState().collections;

    const analysis = getActions().analyzeImport(
      getActions().exportCollections(),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: true });

    const after = collectionsStore.getState().collections;
    expect(after).toHaveLength(1);
    expect(after[0]?.items).toHaveLength(1);
    // No structural change (name, query still the same).
    expect(after[0]?.name).toBe(before[0]?.name);
    expect(after[0]?.items[0]?.query).toBe(before[0]?.items[0]?.query);
  });

  it('re-share updates item in place, not duplicated', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Col');
    const item = getActions().addItem(col.id, { name: 'Op', query: '{ old }' });

    const incoming = makeCol(col.id, col.name, [
      makeItem({ id: item.id, name: 'Op', query: '{ new }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: true });

    const finalCol = collectionsStore
      .getState()
      .collections.find(c => c.id === col.id)!;
    expect(finalCol.items).toHaveLength(1);
    expect(finalCol.items[0]?.id).toBe(item.id);
    expect(finalCol.items[0]?.query).toBe('{ new }');
  });

  it('update-in-place respects recipient org: updates item in D, not in K', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const colK = getActions().createCollection('K');
    const colD = getActions().createCollection('D');
    const item = getActions().addItem(colK.id, {
      name: 'X',
      query: '{ x }',
      createdAt: 500,
    } as any);
    getActions().moveItem(colK.id, 0, colD.id, 0);

    const incoming = makeCol(colK.id, 'K', [
      makeItem({ id: item.id, name: 'X', query: '{ x changed }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: true });

    const state = collectionsStore.getState().collections;
    const kItems = state.find(c => c.id === colK.id)!.items;
    const dItems = state.find(c => c.id === colD.id)!.items;

    expect(kItems).toHaveLength(0);
    expect(dItems).toHaveLength(1);
    expect(dItems[0]?.query).toBe('{ x changed }');
  });

  it('orphan materializes parent: new collection shell created with incoming id+name', () => {
    const item = makeItem({ id: 'item-orphan', name: 'Op', query: '{ q }' });
    const col = makeCol('col-new', 'New Parent', [item]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [col] }),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: true });

    const state = collectionsStore.getState().collections;
    const created = state.find(c => c.id === 'col-new');
    expect(created).toBeDefined();
    expect(created?.name).toBe('New Parent');
    expect(created?.items).toHaveLength(1);
    expect(created?.items[0]?.id).toBe('item-orphan');
  });

  it('new items are always applied regardless of applyChanges:false', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Existing Col');
    const existingItem = getActions().addItem(col.id, {
      name: 'Old',
      query: '{ old }',
    });

    const incoming = makeCol(col.id, col.name, [
      makeItem({ id: existingItem.id, name: 'Old', query: '{ changed }' }),
      makeItem({ id: 'brand-new-item', name: 'New', query: '{ new }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    // applyChanges:false — should still add brand-new-item
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: false });

    const finalCol = collectionsStore
      .getState()
      .collections.find(c => c.id === col.id)!;
    expect(finalCol.items).toHaveLength(2);
    expect(finalCol.items.find(i => i.id === 'brand-new-item')).toBeDefined();
    // Changed item left untouched.
    expect(finalCol.items.find(i => i.id === existingItem.id)?.query).toBe(
      '{ old }',
    );
  });

  it('keep-mine: applyChanges:false leaves changed items untouched', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Col');
    const item = getActions().addItem(col.id, {
      name: 'Op',
      query: '{ local }',
    });

    const incoming = makeCol(col.id, col.name, [
      makeItem({ id: item.id, name: 'Op', query: '{ remote }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: false });

    const finalItem = collectionsStore.getState().collections[0]?.items[0];
    expect(finalItem?.query).toBe('{ local }');
  });

  it('per-item review: only changedItemIds subset is applied', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Col');
    const itemA = getActions().addItem(col.id, {
      name: 'A',
      query: '{ a local }',
    });
    const itemB = getActions().addItem(col.id, {
      name: 'B',
      query: '{ b local }',
    });

    const incoming = makeCol(col.id, col.name, [
      makeItem({ id: itemA.id, name: 'A', query: '{ a remote }' }),
      makeItem({ id: itemB.id, name: 'B', query: '{ b remote }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    // Only apply A.
    getActions().applyImport(analysis, {
      mode: 'merge',
      changedItemIds: new Set([itemA.id]),
    });

    const items = collectionsStore.getState().collections[0]?.items ?? [];
    expect(items.find(i => i.id === itemA.id)?.query).toBe('{ a remote }');
    expect(items.find(i => i.id === itemB.id)?.query).toBe('{ b local }');
  });

  it('collection metadata not overridden by incoming name', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Local Name');

    const incoming = makeCol(col.id, 'Incoming Name', [
      makeItem({ id: 'new-item', name: 'New', query: '{ n }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: true });

    const finalCol = collectionsStore
      .getState()
      .collections.find(c => c.id === col.id)!;
    expect(finalCol.name).toBe('Local Name');
    // But the new item is still added.
    expect(finalCol.items).toHaveLength(1);
  });

  it('merge never deletes: local-only item kept when absent from import', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Col');
    const keepMe = getActions().addItem(col.id, {
      name: 'Keep',
      query: '{ keep }',
    });

    // Import omits keepMe entirely.
    const incoming = makeCol(col.id, col.name, [
      makeItem({ id: 'other', name: 'Other', query: '{ other }' }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: true });

    const finalItems = collectionsStore.getState().collections[0]?.items ?? [];
    expect(finalItems.find(i => i.id === keepMe.id)).toBeDefined();
    expect(finalItems).toHaveLength(2);
  });

  it('update-in-place preserves local createdAt', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Col');
    const item = getActions().addItem(col.id, { name: 'Op', query: '{ old }' });
    const localCreatedAt =
      collectionsStore.getState().collections[0]!.items[0]!.createdAt;

    const incoming = makeCol(col.id, col.name, [
      makeItem({
        id: item.id,
        name: 'Op',
        query: '{ new }',
        createdAt: 9999,
        updatedAt: 9999,
      }),
    ]);
    const analysis = getActions().analyzeImport(
      JSON.stringify({ version: 1, collections: [incoming] }),
    );
    getActions().applyImport(analysis, { mode: 'merge', applyChanges: true });

    const finalItem = collectionsStore.getState().collections[0]?.items[0];
    expect(finalItem?.createdAt).toBe(localCreatedAt);
    expect(finalItem?.query).toBe('{ new }');
  });
});

describe('exportItem', () => {
  it('returns a one-item envelope with parent shell', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('My Col');
    const item = getActions().addItem(col.id, { name: 'Op', query: '{ q }' });

    const parsed = JSON.parse(getActions().exportItem(item.id));
    expect(parsed.version).toBe(1);
    expect(parsed.collections).toHaveLength(1);
    expect(parsed.collections[0]?.id).toBe(col.id);
    expect(parsed.collections[0]?.name).toBe('My Col');
    expect(parsed.collections[0]?.items).toHaveLength(1);
    expect(parsed.collections[0]?.items[0]?.id).toBe(item.id);
  });

  it('returns an empty envelope for an unknown itemId', () => {
    const parsed = JSON.parse(getActions().exportItem('does-not-exist'));
    expect(parsed.version).toBe(1);
    expect(parsed.collections).toEqual([]);
  });

  it('round-trips: exportItem then analyzeImport → item is unchanged', async () => {
    const storage = makeStorage();
    await getActions().init(storage);
    const col = getActions().createCollection('Col');
    getActions().addItem(col.id, { name: 'Op', query: '{ q }' });
    const itemId = collectionsStore.getState().collections[0]!.items[0]!.id;

    const exported = getActions().exportItem(itemId);
    const analysis = getActions().analyzeImport(exported);
    expect(analysis.unchangedCount).toBe(1);
    expect(analysis.newItems).toHaveLength(0);
    expect(analysis.changedItems).toHaveLength(0);
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
    localStorage.setItem(
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
    localStorage.removeItem(key);
  });
});

describe('requestSave', () => {
  it('opens the save dialog for an unlinked tab', () => {
    const savedInPlace = getActions().requestSave({
      id: 'tab-1',
      query: 'query GetUser { user { id } }',
      variables: '{}',
      headers: '',
    });
    expect(savedInPlace).toBe(false);
    const { saveDialog } = collectionsStore.getState();
    expect(saveDialog.open).toBe(true);
    expect(saveDialog.tabId).toBe('tab-1');
    expect(saveDialog.name).toBe('GetUser');
    expect(saveDialog.query).toBe('query GetUser { user { id } }');
  });

  it('updates the linked item in place without opening the dialog', () => {
    const collection = getActions().createCollection('My collection');
    const item = getActions().addItem(collection.id, {
      name: 'GetUser',
      query: 'query GetUser { user { id } }',
      variables: '{}',
      headers: '',
    });
    getActions().linkTab('tab-1', collection.id, item.id);

    const savedInPlace = getActions().requestSave({
      id: 'tab-1',
      query: 'query GetUser { user { id name } }',
      variables: '{"x":1}',
      headers: '{"h":"v"}',
    });
    expect(savedInPlace).toBe(true);

    const { collections, saveDialog } = collectionsStore.getState();
    const saved = collections[0]?.items[0];
    expect(saveDialog.open).toBe(false);
    expect(saved?.id).toBe(item.id);
    expect(saved?.query).toBe('query GetUser { user { id name } }');
    expect(saved?.variables).toBe('{"x":1}');
    expect(saved?.headers).toBe('{"h":"v"}');
    expect(collections[0]?.items).toHaveLength(1);
  });

  it('returns false and does not open the dialog when config.readOnly is true', () => {
    collectionsStore.setState({
      config: {
        readOnly: true,
        allowImportExport: true,
        allowReplace: true,
        allowCopy: true,
      },
    });
    const savedInPlace = getActions().requestSave({
      id: 'tab-1',
      query: 'query GetUser { user { id } }',
    });
    expect(savedInPlace).toBe(false);
    expect(collectionsStore.getState().saveDialog.open).toBe(false);
    // restore default for subsequent tests
    collectionsStore.setState({
      config: {
        readOnly: false,
        allowImportExport: true,
        allowReplace: true,
        allowCopy: true,
      },
    });
  });

  it('falls back to the dialog when the linked item no longer exists', () => {
    const collection = getActions().createCollection('My collection');
    const item = getActions().addItem(collection.id, {
      name: 'GetUser',
      query: 'query GetUser { user { id } }',
    });
    getActions().linkTab('tab-1', collection.id, item.id);
    getActions().deleteItem(collection.id, item.id);

    getActions().requestSave({ id: 'tab-1', query: 'query A { a }' });

    expect(collectionsStore.getState().saveDialog.open).toBe(true);
  });
});
