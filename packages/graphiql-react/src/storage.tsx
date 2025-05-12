// eslint-disable-next-line react/jsx-filename-extension -- TODO
import { Storage, StorageAPI } from '@graphiql/toolkit';
import { FC, ReactNode, useEffect, useState } from 'react';
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
  storage: new StorageAPI(),
}));

// @ts-expect-error -- ignore `children` type warning
export const StorageContextProvider: FC<StorageContextProviderProps> = ({
  storage,
  children,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    storageStore.setState({ storage: new StorageAPI(storage) });
    if (!mounted) {
      setMounted(true);
    }
  }, [storage]); // eslint-disable-line react-hooks/exhaustive-deps -- ignore `mounted` to avoid triggering a re-render

  return mounted && children;
};

function useStorage() {
  return useStore(storageStore, state => state.storage);
}

export { useStorage };
