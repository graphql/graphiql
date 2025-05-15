/* eslint sort-keys: "error" */
import type { ComponentPropsWithoutRef, FC } from 'react';
import { EditorContextProvider } from './stores/editor';
import { ExecutionContextProvider } from './stores/execution';
import { PluginContextProvider } from './stores/plugin';
import { SchemaContextProvider } from './stores/schema';
import { StorageContextProvider } from './stores/storage';

type GraphiQLProviderProps =
  //
  ComponentPropsWithoutRef<typeof EditorContextProvider> &
    ComponentPropsWithoutRef<typeof ExecutionContextProvider> &
    ComponentPropsWithoutRef<typeof PluginContextProvider> &
    ComponentPropsWithoutRef<typeof SchemaContextProvider> &
    ComponentPropsWithoutRef<typeof StorageContextProvider>;

export const GraphiQLProvider: FC<GraphiQLProviderProps> = ({
  defaultHeaders,
  defaultQuery,
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
  onCopyQuery,
  onPrettifyQuery,

  dangerouslyAssumeSchemaIsValid,
  fetcher,
  inputValueDeprecation,
  introspectionQueryName,
  onSchemaChange,
  schema,
  schemaDescription,

  getDefaultFieldNames,
  operationName,

  onTogglePluginVisibility,
  plugins,
  referencePlugin,
  visiblePlugin,

  storage,

  children,
}) => {
  if (!fetcher) {
    throw new TypeError(
      'The `GraphiQLProvider` component requires a `fetcher` function to be passed as prop.',
    );
  }
  const editorContextProps = {
    defaultHeaders,
    defaultQuery,
    defaultTabs,
    externalFragments,
    headers,
    onCopyQuery,
    onEditOperationName,
    onPrettifyQuery,
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
    fetcher,
    getDefaultFieldNames,
    operationName,
  };
  const pluginContextProps = {
    onTogglePluginVisibility,
    plugins,
    referencePlugin,
    visiblePlugin,
  };
  return (
    <StorageContextProvider storage={storage}>
      <EditorContextProvider {...editorContextProps}>
        <SchemaContextProvider {...schemaContextProps}>
          <ExecutionContextProvider {...executionContextProps}>
            <PluginContextProvider {...pluginContextProps}>
              {children}
            </PluginContextProvider>
          </ExecutionContextProvider>
        </SchemaContextProvider>
      </EditorContextProvider>
    </StorageContextProvider>
  );
};
