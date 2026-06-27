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
  method?: 'GET' | 'POST';
  createdAt: number;
  updatedAt: number;
};

/** Pluggable storage interface. Default localStorage adapter ships with the plugin. */
export type CollectionsStorage = {
  storageKey?: string;
  load(): Promise<Collection[]>;
  save(collections: Collection[]): Promise<void>;
};
