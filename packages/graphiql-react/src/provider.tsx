import { EditorContextProvider, EditorContextProviderProps } from './editor';
import {
  ExecutionContextProvider,
  ExecutionContextProviderProps,
} from './execution';
import {
  ExplorerContextProvider,
  ExplorerContextProviderProps,
} from './explorer/context';
import { HistoryContextProvider, HistoryContextProviderProps } from './history';
import { SchemaContextProvider, SchemaContextProviderProps } from './schema';
import { StorageContextProvider, StorageContextProviderProps } from './storage';

export type GraphiQLProviderProps = EditorContextProviderProps &
  ExecutionContextProviderProps &
  ExplorerContextProviderProps &
  HistoryContextProviderProps &
  SchemaContextProviderProps &
  StorageContextProviderProps;

export function GraphiQLProvider({
  children,
  dangerouslyAssumeSchemaIsValid,
  defaultQuery,
  fetcher,
  headers,
  inputValueDeprecation,
  introspectionQueryName,
  isDocExplorerVisible,
  maxHistoryLength,
  onSchemaChange,
  onTabChange,
  onToggleDocExplorerVisibility,
  onToggleHistory,
  operationName,
  query,
  schema,
  schemaDescription,
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
          <SchemaContextProvider
            dangerouslyAssumeSchemaIsValid={dangerouslyAssumeSchemaIsValid}
            fetcher={fetcher}
            inputValueDeprecation={inputValueDeprecation}
            introspectionQueryName={introspectionQueryName}
            onSchemaChange={onSchemaChange}
            schema={schema}
            schemaDescription={schemaDescription}
          >
            <ExecutionContextProvider
              fetcher={fetcher}
              operationName={operationName}
            >
              <ExplorerContextProvider
                isDocExplorerVisible={isDocExplorerVisible}
                onToggleDocExplorerVisibility={onToggleDocExplorerVisibility}
              >
                {children}
              </ExplorerContextProvider>
            </ExecutionContextProvider>
          </SchemaContextProvider>
        </EditorContextProvider>
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}
