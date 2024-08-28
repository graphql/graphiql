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
import { PluginContextProvider, PluginContextProviderProps } from './plugin';
import { SchemaContextProvider, SchemaContextProviderProps } from './schema';
import { StorageContextProvider, StorageContextProviderProps } from './storage';

export type GraphiQLProviderProps = EditorContextProviderProps &
  ExecutionContextProviderProps &
  ExplorerContextProviderProps &
  HistoryContextProviderProps &
  PluginContextProviderProps &
  SchemaContextProviderProps &
  StorageContextProviderProps;

export function GraphiQLProvider({
  children,
  dangerouslyAssumeSchemaIsValid,
  defaultQuery,
  defaultHeaders,
  defaultTabs,
  externalFragments,
  fetcher,
  getDefaultFieldNames,
  inputValueDeprecation,
  introspectionQueryName,
  maxHistoryLength,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onTogglePluginVisibility,
  operationName,
  plugins,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  storage,
  validationRules,
  visiblePlugin,
}: GraphiQLProviderProps) {
  return (
    <StorageContextProvider storage={storage}>
      <HistoryContextProvider maxHistoryLength={maxHistoryLength}>
        <EditorContextProvider
          defaultQuery={defaultQuery}
          defaultHeaders={defaultHeaders}
          defaultTabs={defaultTabs}
          externalFragments={externalFragments}
          onEditOperationName={onEditOperationName}
          onTabChange={onTabChange}
          shouldPersistHeaders={shouldPersistHeaders}
          validationRules={validationRules}
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
              <ExplorerContextProvider>
                <PluginContextProvider
                  onTogglePluginVisibility={onTogglePluginVisibility}
                  plugins={plugins}
                  visiblePlugin={visiblePlugin}
                >
                  {children}
                </PluginContextProvider>
              </ExplorerContextProvider>
            </ExecutionContextProvider>
          </SchemaContextProvider>
        </EditorContextProvider>
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}
