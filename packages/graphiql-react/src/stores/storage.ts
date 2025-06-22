import type { StateCreator } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import type { SlicesWithActions } from '../types';

export interface StorageSlice {
  /**
   * Provide a custom storage API.
   * @default createJSONStorage(() => localStorage)
   * @see https://zustand.docs.pmnd.rs/integrations/persisting-store-data#createjsonstorage
   */
  storage: StateStorage;
}

export interface StorageProps {
  storage?: StorageSlice['storage'];
}

type CreateStorageSlice = (
  initial: StorageSlice,
) => StateCreator<SlicesWithActions, [], [], StorageSlice>;

export const createStorageSlice: CreateStorageSlice = initial => _set =>
  initial;
