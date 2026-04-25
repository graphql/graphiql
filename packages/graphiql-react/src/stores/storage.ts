import type { Storage, StorageAPI } from '@graphiql/toolkit';
import type { StateCreator } from 'zustand';
import type { SlicesWithActions } from '../types';

export interface StorageSlice {
  storage: StorageAPI;
}

export interface StorageProps {
  /**
   * Provide a custom storage API.
   * @default localStorage
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#storage-2|API docs}
   * for details on the required interface.
   */
  storage?: Storage;
}

type CreateStorageSlice = (
  initial: StorageSlice,
) => StateCreator<SlicesWithActions, [], [], StorageSlice>;

export const createStorageSlice: CreateStorageSlice = initial => () => initial;
