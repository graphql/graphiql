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
  externalFragments,
  fetcher,
  getDefaultFieldNames,
  headers,
  inputValueDeprecation,
  introspectionQueryName,
  isDocExplorerVisible,
  maxHistoryLength,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onToggleDocExplorerVisibility,
  onToggleHistory,
  operationName,
  query,
  response,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  storage,
  validationRules,
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
          externalFragments={externalFragments}
          headers={headers}
          onEditOperationName={onEditOperationName}
          onTabChange={onTabChange}
          query={query}
          response={response}
          shouldPersistHeaders={shouldPersistHeaders}
          validationRules={validationRules}
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
              getDefaultFieldNames={getDefaultFieldNames}
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
