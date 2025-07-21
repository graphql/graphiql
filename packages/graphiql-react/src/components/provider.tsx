/* eslint sort-keys: "error" */
import type { FC, ReactNode, RefObject } from 'react';
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useId,
  useState,
} from 'react';
import { create, useStore, UseBoundStore, StoreApi } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { StorageAPI } from '@graphiql/toolkit';
import {
  createEditorSlice,
  createExecutionSlice,
  createPluginSlice,
  createSchemaSlice,
  createThemeSlice,
  createStorageSlice,
  EditorProps,
  ExecutionProps,
  PluginProps,
  SchemaProps,
  ThemeProps,
  StorageProps,
  useMonaco,
} from '../stores';
import type { SlicesWithActions } from '../types';
import { useDidUpdate } from '../utility';
import {
  FragmentDefinitionNode,
  parse,
  visit,
  isSchema,
  validateSchema,
} from 'graphql';
import {
  DEFAULT_PRETTIFY_QUERY,
  DEFAULT_QUERY,
  MONACO_THEME_NAME,
  STORAGE_KEY,
} from '../constants';
import { getDefaultTabState } from '../utility/tabs';

interface GraphiQLProviderProps
  extends EditorProps,
    ExecutionProps,
    PluginProps,
    SchemaProps,
    ThemeProps,
    StorageProps {
  children: ReactNode;
}

type GraphiQLStore = UseBoundStore<StoreApi<SlicesWithActions>>;

const GraphiQLContext = createContext<RefObject<GraphiQLStore> | null>(null);

export const GraphiQLProvider: FC<GraphiQLProviderProps> = props => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime check
  if (!props.fetcher) {
    throw new TypeError(
      'The `GraphiQLProvider` component requires a `fetcher` function to be passed as prop.',
    );
  }
  // @ts-expect-error -- runtime check
  if (props.validationRules) {
    throw new TypeError(
      'The `validationRules` prop has been removed. Use custom GraphQL worker, see https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#custom-webworker-for-passing-non-static-config-to-worker.',
    );
  }
  // @ts-expect-error -- runtime check
  if (props.query) {
    throw new TypeError(
      'The `query` prop has been removed. Use `initialQuery` prop instead, or set value programmatically using:\n' +
        `
const queryEditor = useGraphiQL(state => state.queryEditor)

useEffect(() => {
  queryEditor.setValue(query)
}, [query])`,
    );
  }
  // @ts-expect-error -- runtime check
  if (props.variables) {
    throw new TypeError(
      'The `variables` prop has been removed. Use `initialVariables` prop instead, or set value programmatically using:\n' +
        `
const variableEditor = useGraphiQL(state => state.variableEditor)

useEffect(() => {
  variableEditor.setValue(variables)
}, [variables])`,
    );
  }
  // @ts-expect-error -- runtime check
  if (props.headers) {
    throw new TypeError(
      'The `headers` prop has been removed. Use `initialHeaders` prop instead, or set value programmatically using:\n' +
        `
const headerEditor = useGraphiQL(state => state.headerEditor)

useEffect(() => {
  headerEditor.setValue(headers)
}, [headers])`,
    );
  }
  // @ts-expect-error -- runtime check
  if (props.response) {
    throw new TypeError(
      'The `response` prop has been removed. Set value programmatically using:\n' +
        `
const responseEditor = useGraphiQL(state => state.responseEditor)

useEffect(() => {
  responseEditor.setValue(response)
}, [response])`,
    );
  }
  const { actions } = useMonaco();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    void actions.initialize();
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // This check due hydration issues, it can be removed after setup zustand persist
  if (!mounted) {
    return null;
  }

  return <InnerGraphiQLProvider {...props} />;
};

const InnerGraphiQLProvider: FC<GraphiQLProviderProps> = ({
  defaultHeaders,
  defaultQuery = DEFAULT_QUERY,
  defaultTabs,
  externalFragments,
  onEditOperationName,
  onTabChange,
  shouldPersistHeaders = false,
  onCopyQuery,
  onPrettifyQuery = DEFAULT_PRETTIFY_QUERY,

  dangerouslyAssumeSchemaIsValid = false,
  fetcher,
  inputValueDeprecation = false,
  introspectionQueryName = 'IntrospectionQuery',
  onSchemaChange,
  schema,
  schemaDescription = false,

  getDefaultFieldNames,
  operationName = null,

  onTogglePluginVisibility,
  plugins = [],
  referencePlugin,
  visiblePlugin,
  children,

  defaultTheme = null,
  editorTheme = MONACO_THEME_NAME,

  storage: $storage,

  ...props
}) => {
  const storeRef = useRef<GraphiQLStore>(null!);
  const uriInstanceId = useId();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive
  if (storeRef.current === null) {
    const storage = new StorageAPI($storage);

    function getInitialVisiblePlugin() {
      const storedValue = storage.get(STORAGE_KEY.visiblePlugin);
      const pluginForStoredValue = plugins.find(
        plugin => plugin.title === storedValue,
      );
      if (pluginForStoredValue) {
        return pluginForStoredValue;
      }
      if (storedValue) {
        storage.set(STORAGE_KEY.visiblePlugin, '');
      }
      return visiblePlugin;
    }

    function getInitialTheme() {
      const stored = storage.get(STORAGE_KEY.theme);
      switch (stored) {
        case 'light':
          return 'light';
        case 'dark':
          return 'dark';
        default:
          if (typeof stored === 'string') {
            // Remove the invalid stored value
            storage.set(STORAGE_KEY.theme, '');
          }
          return defaultTheme;
      }
    }

    function getInitialState() {
      // We only need to compute it lazily during the initial render.
      const query = props.initialQuery ?? storage.get(STORAGE_KEY.query);
      const variables =
        props.initialVariables ?? storage.get(STORAGE_KEY.variables);
      const headers = props.initialHeaders ?? storage.get(STORAGE_KEY.headers);

      const { tabs, activeTabIndex } = getDefaultTabState({
        defaultHeaders,
        defaultQuery,
        defaultTabs,
        headers,
        query,
        shouldPersistHeaders,
        storage,
        variables,
      });

      const isStored = storage.get(STORAGE_KEY.persistHeaders) !== null;

      const $shouldPersistHeaders =
        shouldPersistHeaders !== false && isStored
          ? storage.get(STORAGE_KEY.persistHeaders) === 'true'
          : shouldPersistHeaders;

      const store = create<SlicesWithActions>((...args) => {
        const storageSlice = createStorageSlice({ storage })(...args);
        const editorSlice = createEditorSlice({
          activeTabIndex,
          defaultHeaders,
          defaultQuery,
          externalFragments: getExternalFragments(externalFragments),
          initialHeaders: headers ?? defaultHeaders ?? '',
          initialQuery:
            query ?? (activeTabIndex === 0 ? tabs[0]!.query : null) ?? '',
          initialVariables: variables ?? '',
          onCopyQuery,
          onEditOperationName,
          onPrettifyQuery,
          onTabChange,
          shouldPersistHeaders: $shouldPersistHeaders,
          tabs,
          /**
           * Strip colons (React 18) and arrows (React 19) because it breaks monaco-editor
           * variables autocomplete
           */
          uriInstanceId: uriInstanceId.replaceAll(/[:«»]/g, '') + '-',
        })(...args);
        const executionSlice = createExecutionSlice({
          fetcher,
          getDefaultFieldNames,
          overrideOperationName: operationName,
        })(...args);
        const pluginSlice = createPluginSlice({
          onTogglePluginVisibility,
          referencePlugin,
        })(...args);
        const schemaSlice = createSchemaSlice({
          inputValueDeprecation,
          introspectionQueryName,
          onSchemaChange,
          schemaDescription,
        })(...args);
        const themeSlice = createThemeSlice({ editorTheme })(...args);
        return {
          ...storageSlice,
          ...editorSlice,
          ...executionSlice,
          ...pluginSlice,
          ...schemaSlice,
          ...themeSlice,
          actions: {
            ...editorSlice.actions,
            ...executionSlice.actions,
            ...pluginSlice.actions,
            ...schemaSlice.actions,
            ...themeSlice.actions,
          },
        };
      });
      const { actions } = store.getState();
      actions.storeTabs({ activeTabIndex, tabs });
      actions.setPlugins(plugins);
      actions.setVisiblePlugin(getInitialVisiblePlugin());
      actions.setTheme(getInitialTheme());

      return store;
    }

    storeRef.current = getInitialState();
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

  // Execution sync
  useDidUpdate(() => {
    storeRef.current.setState({ fetcher });
  }, [fetcher]);

  // Plugin sync
  useDidUpdate(() => {
    const { actions } = storeRef.current.getState();
    actions.setPlugins(plugins);
    actions.setVisiblePlugin(visiblePlugin);
  }, [plugins, visiblePlugin]);

  /**
   * Synchronize prop changes with state
   */
  useEffect(() => {
    const newSchema = isSchema(schema) || schema == null ? schema : undefined;

    const validationErrors =
      !newSchema || dangerouslyAssumeSchemaIsValid
        ? []
        : validateSchema(newSchema);
    const store = storeRef.current;
    store.setState(({ requestCounter }) => ({
      /**
       * Increment the counter so that in-flight introspection requests don't
       * override this change.
       */
      requestCounter: requestCounter + 1,
      schema: newSchema,
      shouldIntrospect: !isSchema(schema) && schema !== null,
      validationErrors,
    }));

    // Trigger introspection
    const { actions } = store.getState();
    void actions.introspect();
  }, [
    schema,
    dangerouslyAssumeSchemaIsValid,
    fetcher, // should refresh schema with a new fetcher after a fetchError
  ]);

  /**
   * Trigger introspection manually via a short key
   */
  useEffect(() => {
    function runIntrospection(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === 'R') {
        const { actions } = storeRef.current.getState();
        void actions.introspect();
      }
    }

    window.addEventListener('keydown', runIntrospection);
    return () => {
      window.removeEventListener('keydown', runIntrospection);
    };
  }, []);

  return (
    <GraphiQLContext.Provider value={storeRef}>
      {children}
    </GraphiQLContext.Provider>
  );
};

export function useGraphiQL<T>(selector: (state: SlicesWithActions) => T): T {
  const store = useContext(GraphiQLContext);
  if (!store) {
    throw new Error(
      `"useGraphiQL" hook must be used within a <GraphiQLProvider> component.
It looks like you are trying to use the hook outside the GraphiQL provider tree.`,
    );
  }
  return useStore(store.current, useShallow(selector));
}

/**
 * Actions are functions used to update values in your store. They are static and never change.
 * @see https://tkdodo.eu/blog/working-with-zustand#separate-actions-from-state
 */
export const useGraphiQLActions = () => useGraphiQL(state => state.actions);

function getExternalFragments(
  externalFragments: GraphiQLProviderProps['externalFragments'],
) {
  const map = new Map<string, FragmentDefinitionNode>();
  if (externalFragments) {
    if (Array.isArray(externalFragments)) {
      for (const fragment of externalFragments) {
        map.set(fragment.name.value, fragment);
      }
    } else if (typeof externalFragments === 'string') {
      visit(parse(externalFragments), {
        FragmentDefinition(fragment) {
          map.set(fragment.name.value, fragment);
        },
      });
    } else {
      throw new TypeError(
        'The `externalFragments` prop must either be a string that contains the fragment definitions in SDL or a list of `FragmentDefinitionNode` objects.',
      );
    }
  }
  return map;
}
