import { EditorContextProvider, EditorContextProviderProps } from './editor';
import { HistoryContextProvider, HistoryContextProviderProps } from './history';
import { SchemaContextProvider, SchemaContextProviderProps } from './schema';
import { StorageContextProvider, StorageContextProviderProps } from './storage';

export type GraphiQLProviderProps = EditorContextProviderProps &
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
  maxHistoryLength,
  onSchemaChange,
  onTabChange,
  onToggleHistory,
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
            {children}
          </SchemaContextProvider>
        </EditorContextProvider>
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}
