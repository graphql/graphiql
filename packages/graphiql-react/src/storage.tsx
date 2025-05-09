import { Storage, StorageAPI } from '@graphiql/toolkit';
import {
  createContext,
  FC,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { create, StoreApi, useStore } from 'zustand/index';

export type StorageContextType = {
  storage: StorageAPI | null;
};

const StorageContext = createContext<RefObject<
  StoreApi<StorageContextType>
> | null>(null);

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

export const StorageContextProvider: FC<StorageContextProviderProps> = ({
  storage,
  children,
}) => {
  const isInitialRender = useRef(true);
  const storeRef = useRef<StoreApi<StorageContextType>>(null!);

  if (storeRef.current === null) {
    storeRef.current = create<StorageContextType>()(() => ({
      storage: new StorageAPI(storage),
    }));
  }

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    storeRef.current.setState({ storage: new StorageAPI(storage) });
  }, [storage]);

  return (
    <StorageContext.Provider value={storeRef}>
      {children}
    </StorageContext.Provider>
  );
};

const defaultStore = create<StorageContextType>()(() => ({
  storage: null,
}));

function useStorage(): StorageAPI | null;
function useStorage(options: { nonNull: true }): StorageAPI;
function useStorage(options: { nonNull: boolean }): StorageAPI | null;
function useStorage(options?: { nonNull?: boolean }): StorageAPI | null {
  const store = useContext(StorageContext);
  if (options?.nonNull && !store) {
    throw new Error(
      'Tried to use `useStorage` without the necessary context. Make sure to render the `StorageContextProvider` component higher up the tree.',
    );
  }
  return useStore(store ? store.current : defaultStore, state => state.storage);
}

export { useStorage };
