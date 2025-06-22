import type { PersistStorage } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type { SlicesWithActions, Theme } from '../types';

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
  storage: PersistStorage<GraphiQLPersistedState>;
}

export interface StorageProps {
  storage?: StorageSlice['storage'];
}

type CreateStorageSlice = (
  initial: StorageSlice,
) => StateCreator<SlicesWithActions, [], [], StorageSlice>;

export const createStorageSlice: CreateStorageSlice = initial => _set =>
  initial;
