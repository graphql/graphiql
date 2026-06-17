import { createStore } from 'zustand';
import { createBoundedUseStore } from '@graphiql/react';
import type { Collection, CollectionItem, CollectionsStorage } from './types';
import { localStorageAdapter } from './storage/local-storage';

type CollectionsState = {
  collections: Collection[];
  loaded: boolean;
  storage: CollectionsStorage;
};

type CollectionsActions = {
  init(storage: CollectionsStorage): Promise<void>;
  createCollection(name: string, description?: string): Collection;
  deleteCollection(id: string): void;
  renameCollection(id: string, name: string): void;
  addItem(
    collectionId: string,
    item: Omit<CollectionItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): CollectionItem;
  updateItem(
    collectionId: string,
    itemId: string,
    updates: Partial<Omit<CollectionItem, 'id' | 'createdAt'>>,
  ): void;
  deleteItem(collectionId: string, itemId: string): void;
  moveItem(
    fromCollectionId: string,
    fromIndex: number,
    toCollectionId: string,
    toIndex: number,
  ): void;
  importCollections(json: string, mode: 'merge' | 'replace'): void;
  exportCollections(): string;
};

type StoreShape = CollectionsState & { actions: CollectionsActions };

export const collectionsStore = createStore<StoreShape>((set, get) => {
  const persist = async () => {
    await get().storage.save(get().collections);
  };

  return {
    collections: [],
    loaded: false,
    storage: localStorageAdapter,
    actions: {
      async init(storage) {
        const collections = await storage.load();
        set({ collections, loaded: true, storage });
      },
      createCollection(name, description) {
        const c: Collection = {
          id: crypto.randomUUID(),
          name,
          description,
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(s => ({ collections: [...s.collections, c] }));
        void persist();
        return c;
      },
      deleteCollection(id) {
        set(s => ({ collections: s.collections.filter(c => c.id !== id) }));
        void persist();
      },
      renameCollection(id, name) {
        set(s => ({
          collections: s.collections.map(c =>
            c.id === id ? { ...c, name, updatedAt: Date.now() } : c,
          ),
        }));
        void persist();
      },
      addItem(collectionId, item) {
        const newItem: CollectionItem = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(s => ({
          collections: s.collections.map(c =>
            c.id === collectionId
              ? { ...c, items: [...c.items, newItem], updatedAt: Date.now() }
              : c,
          ),
        }));
        void persist();
        return newItem;
      },
      updateItem(collectionId, itemId, updates) {
        set(s => ({
          collections: s.collections.map(c =>
            c.id === collectionId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  items: c.items.map(i =>
                    i.id === itemId
                      ? { ...i, ...updates, updatedAt: Date.now() }
                      : i,
                  ),
                }
              : c,
          ),
        }));
        void persist();
      },
      deleteItem(collectionId, itemId) {
        set(s => ({
          collections: s.collections.map(c =>
            c.id === collectionId
              ? {
                  ...c,
                  items: c.items.filter(i => i.id !== itemId),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        }));
        void persist();
      },
      moveItem(fromCollectionId, fromIndex, toCollectionId, toIndex) {
        const { collections } = get();
        const fromCollection = collections.find(c => c.id === fromCollectionId);
        if (
          !fromCollection ||
          fromIndex < 0 ||
          fromIndex >= fromCollection.items.length
        )
          return;

        const item = fromCollection.items[fromIndex];
        if (!item) return;
        const newCollections = collections.map(c => {
          if (c.id === fromCollectionId && c.id === toCollectionId) {
            const items = [...c.items];
            items.splice(fromIndex, 1);
            items.splice(toIndex, 0, item);
            return { ...c, items, updatedAt: Date.now() };
          }
          if (c.id === fromCollectionId) {
            return {
              ...c,
              items: c.items.filter((_, i) => i !== fromIndex),
              updatedAt: Date.now(),
            };
          }
          if (c.id === toCollectionId) {
            const items = [...c.items];
            items.splice(toIndex, 0, item);
            return { ...c, items, updatedAt: Date.now() };
          }
          return c;
        });
        set({ collections: newCollections });
        void persist();
      },
      importCollections(json, mode) {
        try {
          const parsed = JSON.parse(json);
          const incoming: Collection[] = Array.isArray(parsed.collections)
            ? parsed.collections
            : Array.isArray(parsed)
              ? parsed
              : [];
          if (mode === 'replace') {
            set({ collections: incoming });
          } else {
            const existing = get().collections;
            const existingIds = new Set(existing.map(c => c.id));
            const merged = [
              ...existing,
              ...incoming.filter(c => !existingIds.has(c.id)),
            ];
            set({ collections: merged });
          }
          void persist();
        } catch {
          // invalid JSON — no-op
        }
      },
      exportCollections() {
        return JSON.stringify(
          { version: 1, collections: get().collections },
          null,
          2,
        );
      },
    },
  };
});

export const useCollectionsStore = createBoundedUseStore(collectionsStore);
