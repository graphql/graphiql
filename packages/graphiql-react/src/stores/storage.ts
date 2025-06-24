import type { StateCreator } from 'zustand';
import type { PersistStorage, StateStorage } from 'zustand/middleware';
import type { SlicesWithActions, Theme } from '../types';
import type { TabState } from '../utility/tabs';

export type Storage = PersistStorage<GraphiQLPersistedState>;

interface GraphiQLPersistedState {
  activeTabIndex: number;
  shouldPersistHeaders: boolean;
  tabs: TabState[];
  theme?: Theme;
  visiblePlugin?: string;
}

export interface StorageSlice {
  /**
   * Provide a custom storage API.
   * @default createJSONStorage(() => localStorage)
   * @see https://zustand.docs.pmnd.rs/integrations/persisting-store-data#createjsonstorage
   */
  storage: StateStorage;
}

export interface StorageProps {
  storage?: Storage;
}

type CreateStorageSlice = (
  initial: StorageSlice,
) => StateCreator<SlicesWithActions, [], [], StorageSlice>;

export const createStorageSlice: CreateStorageSlice = initial => _set =>
  initial;
