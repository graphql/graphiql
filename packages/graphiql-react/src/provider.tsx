import { HistoryContextProvider, HistoryContextProviderProps } from './history';
import { StorageContextProvider, StorageContextProviderProps } from './storage';

export type GraphiQLProviderProps = HistoryContextProviderProps &
  StorageContextProviderProps;

export function GraphiQLProvider({
  children,
  maxHistoryLength,
  onToggleHistory,
  storage,
}: GraphiQLProviderProps) {
  return (
    <StorageContextProvider storage={storage}>
      <HistoryContextProvider
        maxHistoryLength={maxHistoryLength}
        onToggleHistory={onToggleHistory}
      >
        {children}
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}
