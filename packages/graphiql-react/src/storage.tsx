import { Storage, StorageAPI } from '@graphiql/toolkit';
import { createContext, ReactNode, useEffect, useState } from 'react';

export type StorageContextType = StorageAPI;

export const StorageContext = createContext<StorageContextType | null>(null);

type StorageContextProviderProps = {
  children: ReactNode;
  storage?: Storage;
};

export function StorageContextProvider(props: StorageContextProviderProps) {
  const [storage, setStorage] = useState(new StorageAPI(props.storage));

  useEffect(() => {
    setStorage(new StorageAPI(props.storage));
  }, [props.storage]);

  return (
    <StorageContext.Provider value={storage}>
      {props.children}
    </StorageContext.Provider>
  );
}
