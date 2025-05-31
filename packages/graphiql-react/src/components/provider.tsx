/* eslint sort-keys: "error" */
import type {
  ComponentPropsWithoutRef,
  FC,
  ReactElement,
  ReactNode,
} from 'react';
import { createContext, useContext, useRef, useEffect } from 'react';
import { useStore, create, UseBoundStore, StoreApi } from 'zustand';
import {
  EditorProps,
  createEditorSlice,
  PERSIST_HEADERS_STORAGE_KEY,
} from '../stores/editor';
import { ExecutionProps, createExecutionSlice } from '../stores/execution';
import { PluginProps, createPluginSlice } from '../stores/plugin';
import { SchemaProps, createSchemaSlice } from '../stores/schema';
import { StorageStore, useStorage } from '../stores/storage';
import { ThemeStore } from '../stores/theme';
import { AllSlices } from '../types';
import { pick, useSynchronizeValue } from '../utility';
import { FragmentDefinitionNode, parse, visit } from 'graphql';
import { DEFAULT_PRETTIFY_QUERY, DEFAULT_QUERY } from '../constants';
import { STORAGE_KEY_QUERY } from './query-editor';
import { STORAGE_KEY as STORAGE_KEY_VARIABLES } from './variable-editor';
import { STORAGE_KEY as STORAGE_KEY_HEADERS } from './header-editor';
import { getDefaultTabState } from '../utility/tabs';

interface InnerGraphiQLProviderProps
  extends EditorProps,
    ExecutionProps,
    PluginProps,
    SchemaProps {
  children: ReactNode;
}

type GraphiQLProviderProps =
  //
  InnerGraphiQLProviderProps &
    ComponentPropsWithoutRef<typeof StorageStore> &
    ComponentPropsWithoutRef<typeof ThemeStore>;

type GraphiQLStore = UseBoundStore<StoreApi<AllSlices>>;

const GraphiQLContext = createContext<GraphiQLStore>(null!);

export const GraphiQLProvider: FC<GraphiQLProviderProps> = ({
  storage,
  defaultTheme,
  editorTheme,
  ...props
}) => {
  return (
    <StorageStore storage={storage}>
      <ThemeStore defaultTheme={defaultTheme} editorTheme={editorTheme}>
        <InnerGraphiQLProvider {...props} />
      </ThemeStore>
    </StorageStore>
  );
};

interface SynchronizeValueProps
  extends Pick<EditorProps, 'headers' | 'query' | 'response' | 'variables'> {
  children: ReactNode;
}

const InnerGraphiQLProvider: FC<InnerGraphiQLProviderProps> = ({
  defaultHeaders,
  defaultQuery,
  defaultTabs,
  externalFragments,
  onEditOperationName,
  onTabChange,
  shouldPersistHeaders = false,
  validationRules = [],
  onCopyQuery,
  onPrettifyQuery = DEFAULT_PRETTIFY_QUERY,

  dangerouslyAssumeSchemaIsValid,
  fetcher,
  inputValueDeprecation,
  introspectionQueryName,
  onSchemaChange,
  schema,
  schemaDescription,

  getDefaultFieldNames,
  operationName = null,

  onTogglePluginVisibility,
  plugins = [],
  referencePlugin,
  visiblePlugin,
  children,
  ...props
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime check
  if (!fetcher) {
    throw new TypeError(
      'The `GraphiQLProvider` component requires a `fetcher` function to be passed as prop.',
    );
  }
  const storage = useStorage();
  const storeRef = useRef<GraphiQLStore>(null!);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive
  if (storeRef.current === null) {
    // We only need to compute it lazily during the initial render.
    const query = props.query ?? storage.get(STORAGE_KEY_QUERY) ?? null;
    const variables =
      props.variables ?? storage.get(STORAGE_KEY_VARIABLES) ?? null;
    const headers = props.headers ?? storage.get(STORAGE_KEY_HEADERS) ?? null;
    const response = props.response ?? '';

    const { tabs, activeTabIndex } = getDefaultTabState({
      defaultHeaders,
      defaultQuery: defaultQuery || DEFAULT_QUERY,
      defaultTabs,
      headers,
      query,
      shouldPersistHeaders,
      variables,
    });

    const isStored = storage.get(PERSIST_HEADERS_STORAGE_KEY) !== null;

    const $shouldPersistHeaders =
      shouldPersistHeaders !== false && isStored
        ? storage.get(PERSIST_HEADERS_STORAGE_KEY) === 'true'
        : shouldPersistHeaders;

    storeRef.current = create<AllSlices>((...args) => ({
      ...createEditorSlice({
        activeTabIndex,
        initialHeaders: headers ?? defaultHeaders ?? '',
        initialQuery:
          query ?? (activeTabIndex === 0 ? tabs[0]!.query : null) ?? '',
        initialResponse: response,
        initialVariables: variables ?? '',
        shouldPersistHeaders: $shouldPersistHeaders,
        tabs,
      })(...args),
      ...createExecutionSlice(...args),
      ...createPluginSlice(...args),
      ...createSchemaSlice(...args),
    }));
    storeRef.current.getState().storeTabs({ activeTabIndex, tabs });
  }
  // TODO:
  // const lastShouldPersistHeadersProp = useRef<boolean | undefined>(undefined);
  // useEffect(() => {
  //   const propValue = shouldPersistHeaders;
  //   if (lastShouldPersistHeadersProp.current !== propValue) {
  //     editorStore.getState().setShouldPersistHeaders(propValue);
  //     lastShouldPersistHeadersProp.current = propValue;
  //   }
  // }, [shouldPersistHeaders]);

  const $externalFragments = (() => {
    const map = new Map<string, FragmentDefinitionNode>();
    if (Array.isArray(externalFragments)) {
      for (const fragment of externalFragments) {
        map.set(fragment.name.value, fragment);
      }
    } else if (typeof externalFragments === 'string') {
      visit(parse(externalFragments, {}), {
        FragmentDefinition(fragment) {
          map.set(fragment.name.value, fragment);
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime check
    } else if (externalFragments) {
      throw new Error(
        'The `externalFragments` prop must either be a string that contains the fragment definitions in SDL or a list of FragmentDefinitionNode objects.',
      );
    }
    return map;
  })();
  // Editor sync
  useEffect(() => {
    storeRef.current.setState({
      defaultHeaders,
      defaultQuery,
      externalFragments: $externalFragments,
      onCopyQuery,
      onEditOperationName,
      onPrettifyQuery,
      onTabChange,
      validationRules,
    });
  }, [
    $externalFragments,
    onTabChange,
    onEditOperationName,
    defaultQuery,
    defaultHeaders,
    validationRules,
    onCopyQuery,
    onPrettifyQuery,
  ]);
  // Execution sync
  useEffect(() => {
    storeRef.current.setState({
      fetcher,
      getDefaultFieldNames,
      overrideOperationName: operationName,
    });
  }, [getDefaultFieldNames, operationName, fetcher]);
  // Plugin sync
  useEffect(() => {
    // TODO: visiblePlugin initial data
    // const storedValue = storage.get(STORAGE_KEY);
    // const pluginForStoredValue = plugins.find(
    //   plugin => plugin.title === storedValue,
    // );
    // if (pluginForStoredValue) {
    //   return pluginForStoredValue;
    // }
    // if (storedValue) {
    //   storage.set(STORAGE_KEY, '');
    // }
    const store = storeRef.current;
    const { setPlugins, setVisiblePlugin } = store.getState();

    setPlugins(plugins);
    setVisiblePlugin(visiblePlugin ?? null);
    store.setState({
      onTogglePluginVisibility,
      referencePlugin,
    });
  }, [plugins, onTogglePluginVisibility, referencePlugin, visiblePlugin]);

  return (
    <GraphiQLContext.Provider value={storeRef.current}>
      <SynchronizeValue {...props}>{children}</SynchronizeValue>
    </GraphiQLContext.Provider>
  );
};

// const STORAGE_KEY = 'visiblePlugin';

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
