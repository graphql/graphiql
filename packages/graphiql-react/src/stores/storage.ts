import { Storage, StorageAPI } from '@graphiql/toolkit';
import { FC, ReactElement, ReactNode, useEffect } from 'react';
import { createStore } from 'zustand';
import { createBoundedUseStore } from '../utility';

interface StorageStoreType {
  storage: StorageAPI;
}

interface StorageStoreProps {
  children: ReactNode;

  /**
   * Provide a custom storage API.
   * @default localStorage
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#storage-2|API docs}
   * for details on the required interface.
   */
  storage?: Storage;
}

export const storageStore = createStore<StorageStoreType>(() => ({
  storage: null!,
}));

export const StorageStore: FC<StorageStoreProps> = ({ storage, children }) => {
  const isMounted = useStorageStore(store => Boolean(store.storage));

  useEffect(() => {
    storageStore.setState({ storage: new StorageAPI(storage) });
  }, [storage]);

  if (!isMounted) {
    // Ensure storage was initialized
    return null;
  }

  return children as ReactElement;
};

const useStorageStore = createBoundedUseStore(storageStore);

export const useStorage = () => useStorageStore(store => store.storage);
