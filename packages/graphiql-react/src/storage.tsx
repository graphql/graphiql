import { Storage, StorageAPI } from '@graphiql/toolkit';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { createContextHook, createNullableContext } from './utility/context';

export type StorageContextType = StorageAPI;

export const StorageContext =
  createNullableContext<StorageContextType>('StorageContext');

type StorageContextProviderProps = {
  children: ReactNode;
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
