import { EditorContextProvider, EditorContextProviderProps } from './editor';
import { HistoryContextProvider, HistoryContextProviderProps } from './history';
import { StorageContextProvider, StorageContextProviderProps } from './storage';

export type GraphiQLProviderProps = EditorContextProviderProps &
  HistoryContextProviderProps &
  StorageContextProviderProps;

export function GraphiQLProvider({
  children,
  defaultQuery,
  headers,
  maxHistoryLength,
  onTabChange,
  onToggleHistory,
  query,
  shouldPersistHeaders,
  storage,
  variables,
}: GraphiQLProviderProps) {
  return (
    <StorageContextProvider storage={storage}>
      <HistoryContextProvider
        maxHistoryLength={maxHistoryLength}
        onToggleHistory={onToggleHistory}
      >
        <EditorContextProvider
          defaultQuery={defaultQuery}
          headers={headers}
          onTabChange={onTabChange}
          query={query}
          shouldPersistHeaders={shouldPersistHeaders}
          variables={variables}
        >
          {children}
        </EditorContextProvider>
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}
