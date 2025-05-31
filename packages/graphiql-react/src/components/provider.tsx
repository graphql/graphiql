/* eslint sort-keys: "error" */
import type {
  ComponentPropsWithoutRef,
  FC,
  ReactElement,
  ReactNode,
} from 'react';
import { createContext, useContext, useRef } from 'react';
import { useStore, create } from 'zustand';
import { EditorProps, createEditorSlice } from '../stores/editor';
import { ExecutionProps, createExecutionSlice } from '../stores/execution';
import { PluginProps, createPluginSlice } from '../stores/plugin';
import { SchemaProps, createSchemaSlice } from '../stores/schema';
import { StorageStore } from '../stores/storage';
import { ThemeStore } from '../stores/theme';
import { AllSlices } from '../types';
import { pick, useSynchronizeValue } from '../utility';

type GraphiQLProviderProps =
  //
  EditorProps &
    ExecutionProps &
    PluginProps &
    SchemaProps &
    ComponentPropsWithoutRef<typeof StorageStore> &
    ComponentPropsWithoutRef<typeof ThemeStore>;

type GraphiQLStore = ReturnType<typeof createGraphiQLStore>;

function createGraphiQLStore() {
  return create<AllSlices>((...args) => ({
    ...createEditorSlice(...args),
    ...createExecutionSlice(...args),
    ...createPluginSlice(...args),
    ...createSchemaSlice(...args),
  }));
}

const GraphiQLContext = createContext<GraphiQLStore>(null!);

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
  const synchronizeValueProps = {
    headers,
    query,
    response,
    variables,
  };

  const editorContextProps = {
    defaultHeaders,
    defaultQuery,
    defaultTabs,
    externalFragments,
    onCopyQuery,
    onEditOperationName,
    onPrettifyQuery,
    onTabChange,
    shouldPersistHeaders,
    validationRules,
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
  const storeRef = useRef<GraphiQLStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createGraphiQLStore();
  }

  return (
    <StorageStore storage={storage}>
      <ThemeStore defaultTheme={defaultTheme} editorTheme={editorTheme}>
        <GraphiQLContext.Provider value={storeRef.current}>
          <SynchronizeValue {...synchronizeValueProps}>
            {children}
          </SynchronizeValue>
        </GraphiQLContext.Provider>
      </ThemeStore>
    </StorageStore>
  );
};

interface SynchronizeValueProps
  extends Pick<EditorProps, 'headers' | 'query' | 'response' | 'variables'> {
  children: ReactNode;
}

const SynchronizeValue: FC<SynchronizeValueProps> = ({
  children,
  headers,
  query,
  response,
  variables,
}) => {
  const { headerEditor, queryEditor, responseEditor, variableEditor } =
    useGraphiQL(
      pick('headerEditor', 'queryEditor', 'responseEditor', 'variableEditor'),
    );

  useSynchronizeValue(headerEditor, headers);
  useSynchronizeValue(queryEditor, query);
  useSynchronizeValue(responseEditor, response);
  useSynchronizeValue(variableEditor, variables);
  return children as ReactElement;
};

export function useGraphiQL<T>(selector: (state: AllSlices) => T): T {
  const store = useContext(GraphiQLContext);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- fixme
  if (!store) {
    throw new Error('Missing `GraphiQLContext.Provider` in the tree');
  }
  return useStore(store, selector);
}
