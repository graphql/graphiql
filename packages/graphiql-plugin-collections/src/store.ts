import { createStore } from 'zustand';
import { createBoundedUseStore } from '@graphiql/react';
import { z } from 'zod';
import { randomId } from './utility/uuid';
import type {
  Collection,
  CollectionItem,
  CollectionsConfig,
  CollectionsStorage,
  ImportAnalysis,
  ImportResolution,
} from './types';
import { DEFAULT_COLLECTIONS_CONFIG } from './types';
import { localStorageAdapter } from './storage/local-storage';
import { loadTabLinks, saveTabLinks, type TabLink } from './storage/tab-links';

/** The active operation being saved, as seen by the save dialog. */
export type SaveDialogState = {
  open: boolean;
  /** The tab this save originated from, linked to the item once saved. */
  tabId?: string;
  query: string;
  variables: string;
  headers: string;
  name: string;
};

/** The current operation handed to `requestSave` from ⌘S or the save button. */
export type ActiveOperation = {
  id?: string;
  query: string | null;
  variables?: string | null;
  headers?: string | null;
  operationName?: string | null;
};

type CollectionsState = {
  collections: Collection[];
  loaded: boolean;
  storage: CollectionsStorage;
  /** Host-controlled capability flags; set on init from the plugin options. */
  config: CollectionsConfig;
  /** Maps a tab id to the collection item it is linked to. */
  links: Record<string, TabLink>;
  saveDialog: SaveDialogState;
};

type CollectionsActions = {
  init(
    storage: CollectionsStorage,
    config?: Partial<CollectionsConfig>,
  ): Promise<void>;
  /**
   * Replace the in-memory collections wholesale without persisting. Use this
   * to reflect state loaded or merged externally — writing it back would be
   * redundant and, for a DB adapter, an unwanted extra write.
   */
  setCollections(collections: Collection[]): void;
  /** Re-read collections from the configured storage — call after an external/remote change to refresh the UI. */
  reload(): Promise<void>;
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
  /** Pure analysis of an import JSON string against current store state. Never mutates. */
  analyzeImport(json: string): ImportAnalysis;
  /** Commit an analysis to the store using the given resolution strategy. */
  applyImport(analysis: ImportAnalysis, resolution: ImportResolution): void;
  exportCollections(): string;
  /** Export a single collection as a (one-collection) export envelope. */
  exportCollection(id: string): string;
  /** Export a single item as a (one-item, one-collection) export envelope. */
  exportItem(itemId: string): string;
  /** Link a tab to a collection item so ⌘S updates it in place. */
  linkTab(tabId: string, collectionId: string, itemId: string): void;
  /**
   * Save the active operation: update the linked item in place if the tab is
   * already tied to a collection item, otherwise open the save dialog. Returns
   * `true` when it saved in place (so the caller can clear the dirty state),
   * `false` when it opened the dialog instead.
   */
  requestSave(operation: ActiveOperation): boolean;
  openSaveDialog(input: Omit<SaveDialogState, 'open'>): void;
  closeSaveDialog(): void;
};

const INITIAL_SAVE_DIALOG: SaveDialogState = {
  open: false,
  query: '',
  variables: '',
  headers: '',
  name: '',
};

export function deriveOperationName(
  query: string,
  fallback?: string | null,
): string {
  if (fallback) {
    return fallback;
  }
  const match =
    /(?:query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(query);
  return match?.[1] ?? 'Unnamed operation';
}

type StoreShape = CollectionsState & { actions: CollectionsActions };

/** Drop every link that points at one of `itemIds`. */
function pruneLinksForItems(
  links: Record<string, TabLink>,
  itemIds: Set<string>,
): Record<string, TabLink> {
  const next: Record<string, TabLink> = {};
  for (const [tabId, link] of Object.entries(links)) {
    if (!itemIds.has(link.itemId)) {
      next[tabId] = link;
    }
  }
  return next;
}

/** Normalize optional string fields so undefined and '' are treated identically. */
const norm = (v: string | undefined): string => v ?? '';

/** Compare only the user-visible content fields of two items, ignoring id and timestamps. */
function itemContentEqual(a: CollectionItem, b: CollectionItem): boolean {
  return (
    a.name === b.name &&
    norm(a.query) === norm(b.query) &&
    norm(a.variables) === norm(b.variables) &&
    norm(a.headers) === norm(b.headers)
  );
}

export const collectionsStore = createStore<StoreShape>((set, get) => {
  const persist = async () => {
    await get().storage.save(get().collections);
  };

  return {
    collections: [],
    loaded: false,
    storage: localStorageAdapter,
    config: DEFAULT_COLLECTIONS_CONFIG,
    links: {},
    saveDialog: INITIAL_SAVE_DIALOG,
    actions: {
      async init(storage, config) {
        const collections = await storage.load();
        set({
          collections,
          loaded: true,
          storage,
          config: { ...DEFAULT_COLLECTIONS_CONFIG, ...config },
          // Restore tab↔item links so ⌘S on a tab reopened from the previous
          // session still updates its saved operation in place.
          links: loadTabLinks(),
        });
      },
      setCollections(collections) {
        set({ collections });
      },
      async reload() {
        const collections = await get().storage.load();
        set({ collections });
      },
      createCollection(name, description) {
        const c: Collection = {
          id: randomId(),
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
        const removed = get().collections.find(c => c.id === id);
        const removedItemIds = new Set(removed?.items.map(i => i.id) ?? []);
        set(s => ({
          collections: s.collections.filter(c => c.id !== id),
          links: pruneLinksForItems(s.links, removedItemIds),
        }));
        void persist();
        saveTabLinks(get().links);
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
          id: randomId(),
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
          links: pruneLinksForItems(s.links, new Set([itemId])),
        }));
        void persist();
        saveTabLinks(get().links);
      },
      moveItem(fromCollectionId, fromIndex, toCollectionId, toIndex) {
        const { collections } = get();
        const fromCollection = collections.find(c => c.id === fromCollectionId);
        if (
          !fromCollection ||
          fromIndex < 0 ||
          fromIndex >= fromCollection.items.length
        ) {
          return;
        }

        const item = fromCollection.items[fromIndex];
        if (!item) {
          return;
        }
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
      analyzeImport(json) {
        const empty: ImportAnalysis = {
          ok: false,
          newCollections: [],
          newItems: [],
          changedItems: [],
          unchangedCount: 0,
          _incoming: [],
        };

        // Zod schemas for the import envelope.
        const CollectionItemSchema = z.object({
          id: z.string(),
          name: z.string(),
          query: z.string(),
          variables: z.string().optional(),
          headers: z.string().optional(),
          description: z.string().optional(),
          createdAt: z.number(),
          updatedAt: z.number(),
        });

        const CollectionSchema = z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          createdAt: z.number(),
          updatedAt: z.number(),
          items: z.array(CollectionItemSchema),
        });

        const EnvelopeSchema = z.union([
          z.object({
            version: z.number().optional(),
            collections: z.array(CollectionSchema),
          }),
          z.array(CollectionSchema),
        ]);

        let parsed: unknown;
        try {
          parsed = JSON.parse(json);
        } catch {
          return empty;
        }

        const result = EnvelopeSchema.safeParse(parsed);
        if (!result.success) {
          return empty;
        }

        const incoming: Collection[] = Array.isArray(result.data)
          ? result.data
          : result.data.collections;

        if (incoming.length === 0) {
          return empty;
        }

        const localCollections = get().collections;

        // Build a flat map: item id → { item, collectionId } for all local items.
        const localItemMap = new Map<
          string,
          { item: CollectionItem; collectionId: string }
        >();
        for (const col of localCollections) {
          for (const item of col.items) {
            localItemMap.set(item.id, { item, collectionId: col.id });
          }
        }

        const localCollectionIds = new Set(localCollections.map(c => c.id));

        const newCollections: Collection[] = [];
        const newItems: ImportAnalysis['newItems'] = [];
        const changedItems: ImportAnalysis['changedItems'] = [];
        let unchangedCount = 0;

        for (const incomingCol of incoming) {
          // Determine which items in this collection are genuinely new locally.
          const genuinelyNewItems = incomingCol.items.filter(
            item => !localItemMap.has(item.id),
          );

          // Register a new collection shell only when:
          //   - the collection id is absent locally, AND
          //   - it is intentionally empty OR it contributes at least one genuinely new item.
          // A new-to-us collection that only re-homes already-known items must NOT be created.
          if (
            !localCollectionIds.has(incomingCol.id) &&
            (incomingCol.items.length === 0 || genuinelyNewItems.length > 0)
          ) {
            newCollections.push({ ...incomingCol, items: [] });
          }

          for (const incomingItem of incomingCol.items) {
            const local = localItemMap.get(incomingItem.id);
            if (!local) {
              newItems.push({
                item: incomingItem,
                // Land in the incoming parent; if that parent is new it will be
                // created during apply, otherwise it already exists locally.
                targetCollectionId: incomingCol.id,
              });
            } else if (itemContentEqual(incomingItem, local.item)) {
              unchangedCount++;
            } else {
              changedItems.push({
                incoming: incomingItem,
                current: local.item,
                // Use where the recipient actually keeps it, not the incoming parent.
                currentCollectionId: local.collectionId,
              });
            }
          }
        }

        return {
          ok: true,
          newCollections,
          newItems,
          changedItems,
          unchangedCount,
          _incoming: incoming,
        };
      },
      applyImport(analysis, resolution) {
        if (!analysis.ok) {
          return;
        }

        if (resolution.mode === 'replace') {
          set({ collections: analysis._incoming });
          void persist();
          return;
        }

        // Merge mode.
        const now = Date.now();
        let collections = [...get().collections];

        // 1. Create new collection shells.
        for (const shell of analysis.newCollections) {
          collections.push({ ...shell, items: [] });
        }

        // 2. Add new items into their target collections.
        for (const { item, targetCollectionId } of analysis.newItems) {
          collections = collections.map(c =>
            c.id === targetCollectionId
              ? { ...c, items: [...c.items, item], updatedAt: now }
              : c,
          );
        }

        // 3. Apply changed items per resolution.
        const shouldApply = (itemId: string): boolean => {
          if ('applyChanges' in resolution) {
            return resolution.applyChanges;
          }
          return resolution.changedItemIds.has(itemId);
        };

        for (const conflict of analysis.changedItems) {
          if (!shouldApply(conflict.incoming.id)) {
            continue;
          }
          collections = collections.map(c => {
            if (c.id !== conflict.currentCollectionId) {
              return c;
            }
            return {
              ...c,
              updatedAt: now,
              items: c.items.map(i =>
                i.id === conflict.incoming.id
                  ? {
                      // Replace content fields; keep the local createdAt.
                      ...conflict.incoming,
                      createdAt: conflict.current.createdAt,
                      updatedAt: now,
                    }
                  : i,
              ),
            };
          });
        }

        set({ collections });
        void persist();
      },
      exportCollections() {
        return JSON.stringify(
          { version: 1, collections: get().collections },
          null,
          2,
        );
      },
      exportCollection(id) {
        const collection = get().collections.find(c => c.id === id);
        return JSON.stringify(
          { version: 1, collections: collection ? [collection] : [] },
          null,
          2,
        );
      },
      exportItem(itemId) {
        for (const col of get().collections) {
          const item = col.items.find(i => i.id === itemId);
          if (item) {
            const shell: Collection = {
              id: col.id,
              name: col.name,
              description: col.description,
              createdAt: col.createdAt,
              updatedAt: col.updatedAt,
              items: [item],
            };
            return JSON.stringify(
              { version: 1, collections: [shell] },
              null,
              2,
            );
          }
        }
        return JSON.stringify({ version: 1, collections: [] }, null, 2);
      },
      linkTab(tabId, collectionId, itemId) {
        set(s => ({
          // An item lives in exactly one tab: drop any stale link to it (e.g. a
          // closed tab's) before recording the new one.
          links: {
            ...pruneLinksForItems(s.links, new Set([itemId])),
            [tabId]: { collectionId, itemId },
          },
        }));
        saveTabLinks(get().links);
      },
      requestSave(operation) {
        // Authoritative gate: saving is disabled in read-only mode regardless
        // of how it was triggered (⌘S, save button, etc.).
        if (get().config.readOnly) {
          return false;
        }
        const { links, collections, actions } = get();
        const link = operation.id ? links[operation.id] : undefined;
        if (link) {
          const collection = collections.find(c => c.id === link.collectionId);
          const item = collection?.items.find(i => i.id === link.itemId);
          if (item) {
            actions.updateItem(link.collectionId, link.itemId, {
              query: operation.query ?? '',
              variables: operation.variables ?? '',
              headers: operation.headers ?? '',
            });
            return true;
          }
        }
        actions.openSaveDialog({
          tabId: operation.id,
          query: operation.query ?? '',
          variables: operation.variables ?? '',
          headers: operation.headers ?? '',
          name: deriveOperationName(
            operation.query ?? '',
            operation.operationName,
          ),
        });
        return false;
      },
      openSaveDialog(input) {
        set({ saveDialog: { ...input, open: true } });
      },
      closeSaveDialog() {
        set(s => ({ saveDialog: { ...s.saveDialog, open: false } }));
      },
    },
  };
});

export const useCollectionsStore = createBoundedUseStore(collectionsStore);
