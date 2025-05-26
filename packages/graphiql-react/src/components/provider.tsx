/* eslint sort-keys: "error" */
import type { ComponentPropsWithoutRef, FC } from 'react';
import { EditorStore } from '../stores/editor';
import { ExecutionStore } from '../stores/execution';
import { PluginStore } from '../stores/plugin';
import { SchemaStore } from '../stores/schema';
import { StorageStore } from '../stores/storage';
import { ThemeStore } from '../stores/theme';

type GraphiQLProviderProps =
  //
  ComponentPropsWithoutRef<typeof EditorStore> &
    ComponentPropsWithoutRef<typeof ExecutionStore> &
    ComponentPropsWithoutRef<typeof PluginStore> &
    ComponentPropsWithoutRef<typeof SchemaStore> &
    ComponentPropsWithoutRef<typeof StorageStore> &
    ComponentPropsWithoutRef<typeof ThemeStore>;

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

  defaultTheme,
  editorTheme,

  children,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime check
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
    <StorageStore storage={storage}>
      <ThemeStore defaultTheme={defaultTheme} editorTheme={editorTheme}>
        <EditorStore {...editorContextProps}>
          <SchemaStore {...schemaContextProps}>
            <ExecutionStore {...executionContextProps}>
              <PluginStore {...pluginContextProps}>{children}</PluginStore>
            </ExecutionStore>
          </SchemaStore>
        </EditorStore>
      </ThemeStore>
    </StorageStore>
  );
};
