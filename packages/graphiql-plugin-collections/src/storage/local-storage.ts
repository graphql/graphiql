import type { Collection, CollectionsStorage } from '../types';

const DEFAULT_KEY = 'graphiql:collections';
const VERSION = 1;

type StorageEnvelope = {
  version: number;
  collections: Collection[];
};

export function createLocalStorageAdapter(
  storageKey = DEFAULT_KEY,
): CollectionsStorage {
  return {
    async load() {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return [];
        const parsed: StorageEnvelope = JSON.parse(raw);
        if (parsed.version !== VERSION) {
          // Version mismatch: attempt a best-effort migration.
          // V1 has the same shape — just update the version stamp and return collections.
          // Future migrations go here when VERSION is bumped.
          console.warn(
            `[graphiql/plugin-collections] Storage version mismatch (found ${parsed.version}, expected ${VERSION}). Attempting to load collections as-is.`,
          );
          return Array.isArray(parsed.collections) ? parsed.collections : [];
        }
        return parsed.collections ?? [];
      } catch {
        return [];
      }
    },
    async save(collections) {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ version: VERSION, collections }),
        );
      } catch {
        // Storage quota exceeded or unavailable — silent no-op
      }
    },
  };
}

export const localStorageAdapter = createLocalStorageAdapter();
