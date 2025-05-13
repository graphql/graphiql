// eslint-disable-next-line react/jsx-filename-extension -- TODO
import { Storage, StorageAPI } from '@graphiql/toolkit';
import { FC, ReactElement, ReactNode, useEffect } from 'react';
import { useStore, createStore } from 'zustand';

type StorageContextType = {
  storage: StorageAPI;
};

type StorageContextProviderProps = {
  children: ReactNode;
  /**
   * Provide a custom storage API.
   * @default localStorage
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#storage-2|API docs}
   * for details on the required interface.
   */
  storage?: Storage;
};

export const storageStore = createStore<StorageContextType>(() => ({
  storage: null!,
}));

export const StorageContextProvider: FC<StorageContextProviderProps> = ({
  storage,
  children,
}) => {
  const $storage = useStorage();

  useEffect(() => {
    storageStore.setState({ storage: new StorageAPI(storage) });
  }, [storage]);

  return $storage && (children as ReactElement);
};

function useStorage() {
  return useStore(storageStore, state => state.storage);
}

export { useStorage };
