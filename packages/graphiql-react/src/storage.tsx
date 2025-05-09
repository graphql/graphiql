import { Storage, StorageAPI } from '@graphiql/toolkit';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { createContextHook, createNullableContext } from './utility/context';

export type StorageContextType = StorageAPI;

export const StorageContext =
  createNullableContext<StorageContextType>('StorageContext');

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
  const [$storage, setStorage] = useState(() => new StorageAPI(storage));

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
    } else {
      setStorage(new StorageAPI(storage));
    }
  }, [storage]);

  return (
    <StorageContext.Provider value={$storage}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorageContext = createContextHook(StorageContext);
