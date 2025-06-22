import type { PersistStorage } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type { SlicesWithActions, Theme } from '../types';

export type Storage = PersistStorage<GraphiQLPersistedState>;

interface GraphiQLPersistedState {
  theme?: Theme;
  visiblePlugin?: string;
}

export interface StorageSlice {
  /**
   * Provide a custom storage API.
   * @default createJSONStorage(() => localStorage)
   * @see https://zustand.docs.pmnd.rs/integrations/persisting-store-data#createjsonstorage
   */
  storage: Storage;
}

export interface StorageProps {
  storage?: StorageSlice['storage'];
}

type CreateStorageSlice = (
  initial: StorageSlice,
) => StateCreator<SlicesWithActions, [], [], StorageSlice>;

export const createStorageSlice: CreateStorageSlice = initial => _set =>
  initial;
