import { Storage, StorageAPI } from '@graphiql/toolkit';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { createContextHook, createNullableContext } from './utility/context';

export type StorageContextType = StorageAPI;

export const StorageContext =
  createNullableContext<StorageContextType>('StorageContext');

export type StorageContextProviderProps = {
  children: ReactNode;
  /**
   * Provide a custom storage API.
   * @default `localStorage``
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#storage-2|API docs}
   * for details on the required interface.
   */
  storage?: Storage;
};

export function StorageContextProvider(props: StorageContextProviderProps) {
  const isInitialRender = useRef(true);
  const [storage, setStorage] = useState(new StorageAPI(props.storage));

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
    } else {
      setStorage(new StorageAPI(props.storage));
    }
  }, [props.storage]);

  return (
    <StorageContext.Provider value={storage}>
      {props.children}
    </StorageContext.Provider>
  );
}

export const useStorageContext = createContextHook(StorageContext);
