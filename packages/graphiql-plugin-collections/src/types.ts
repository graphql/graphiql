export type Collection = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  items: CollectionItem[];
};

export type CollectionItem = {
  id: string;
  name: string;
  query: string;
  variables?: string;
  headers?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
};

/**
 * Host-controlled capability flags. All capabilities are on by default; a host
 * can turn any of them off to run a governed, read-only, or share-disabled
 * collections experience.
 */
export type CollectionsConfig = {
  /** When true, no write operations are possible (export & copy still allowed). */
  readOnly: boolean;
  /** Master switch for the import/export feature (hides both import and export). */
  allowImportExport: boolean;
  /** When false, the destructive "Replace" import option is hidden. */
  allowReplace: boolean;
  /** When false, "Copy to clipboard" / "Copy operation" affordances are hidden. */
  allowCopy: boolean;
};

export const DEFAULT_COLLECTIONS_CONFIG: CollectionsConfig = {
  readOnly: false,
  allowImportExport: true,
  allowReplace: true,
  allowCopy: true,
};

/** Pluggable storage interface. Default localStorage adapter ships with the plugin. */
export type CollectionsStorage = {
  storageKey?: string;
  load(): Promise<Collection[]>;
  save(collections: Collection[]): Promise<void>;
};

/** An incoming item paired with the collection it should land in. */
export type PlacedItem = {
  item: CollectionItem;
  targetCollectionId: string;
};

/** An incoming item whose id matches a local item but whose content differs. */
export type ItemConflict = {
  incoming: CollectionItem;
  /** The local copy of the item before any merge. */
  current: CollectionItem;
  /** The collection where the recipient currently keeps this item (may differ from incoming parent). */
  currentCollectionId: string;
};

/** Result of `analyzeImport`. Pure — does not mutate store state. */
export type ImportAnalysis = {
  ok: boolean;
  /** Collection shells (no items) whose id is absent locally — to be created on apply. */
  newCollections: Collection[];
  /** Items whose id exists nowhere locally. */
  newItems: PlacedItem[];
  /** Items whose id matches a local item but content differs. */
  changedItems: ItemConflict[];
  /** Items that are byte-for-byte identical to the local copy — nothing to do. */
  unchangedCount: number;
  /** @internal Full parsed incoming list, needed for replace mode in applyImport. */
  _incoming: Collection[];
};

/**
 * How to resolve the import when applying.
 * - `replace` — wholesale overwrite (equivalent to old replace mode).
 * - `merge` with `applyChanges` — apply all or none of the changed items.
 * - `merge` with `changedItemIds` — apply only the listed subset of changed items.
 */
export type ImportResolution =
  | { mode: 'replace' }
  | { mode: 'merge'; applyChanges: boolean }
  | { mode: 'merge'; changedItemIds: Set<string> };
