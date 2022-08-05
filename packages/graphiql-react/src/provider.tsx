import { StorageContextProvider, StorageContextProviderProps } from './storage';

export type GraphiQLProviderProps = StorageContextProviderProps;

export function GraphiQLProvider({ children, storage }: GraphiQLProviderProps) {
  return (
    <StorageContextProvider storage={storage}>
      {children}
    </StorageContextProvider>
  );
}
