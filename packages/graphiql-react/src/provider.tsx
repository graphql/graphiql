import type { ComponentPropsWithoutRef, FC } from 'react';
import { EditorContextProvider } from './editor';
import { ExecutionContextProvider } from './execution';
import { ExplorerContextProvider } from './explorer/context';
import { PluginContextProvider } from './plugin';
import { SchemaContextProvider } from './schema';
import { StorageContextProvider } from './storage';

type GraphiQLProviderProps =
  //
  ComponentPropsWithoutRef<typeof EditorContextProvider> &
    ComponentPropsWithoutRef<typeof ExecutionContextProvider> &
    ComponentPropsWithoutRef<typeof ExplorerContextProvider> &
    ComponentPropsWithoutRef<typeof PluginContextProvider> &
    ComponentPropsWithoutRef<typeof SchemaContextProvider> &
    ComponentPropsWithoutRef<typeof StorageContextProvider>;

export const GraphiQLProvider: FC<GraphiQLProviderProps> = ({
  children,
  dangerouslyAssumeSchemaIsValid,
  defaultQuery,
  defaultHeaders,
  defaultTabs,
  externalFragments,
  fetcher,
  getDefaultFieldNames,
  headers,
  inputValueDeprecation,
  introspectionQueryName,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onTogglePluginVisibility,
  operationName,
  plugins,
  query,
  response,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  storage,
  validationRules,
  variables,
  visiblePlugin,
}) => {
  const editorContextProps = {
    defaultQuery,
    defaultHeaders,
    defaultTabs,
    externalFragments,
    headers,
    onEditOperationName,
    onTabChange,
    query,
    response,
    shouldPersistHeaders,
    validationRules,
    variables,
  };
  const schemaContextProps = {
    dangerouslyAssumeSchemaIsValid,
    fetcher,
    inputValueDeprecation,
    introspectionQueryName,
    onSchemaChange,
    schema,
    schemaDescription,
  };
  const executionContextProps = {
    getDefaultFieldNames,
    fetcher,
    operationName,
  };
  const pluginContextProps = {
    onTogglePluginVisibility,
    plugins,
    visiblePlugin,
  };
  return (
    <StorageContextProvider storage={storage}>
      <EditorContextProvider {...editorContextProps}>
        <SchemaContextProvider {...schemaContextProps}>
          <ExecutionContextProvider {...executionContextProps}>
            <ExplorerContextProvider>
              <PluginContextProvider {...pluginContextProps}>
                {children}
              </PluginContextProvider>
            </ExplorerContextProvider>
          </ExecutionContextProvider>
        </SchemaContextProvider>
      </EditorContextProvider>
    </StorageContextProvider>
  );
};
