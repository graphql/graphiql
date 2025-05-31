/* eslint sort-keys: "error" */
import type {
  ComponentPropsWithoutRef,
  FC,
  ReactElement,
  ReactNode,
} from 'react';
import { createContext, useContext, useRef, useEffect } from 'react';
import { useStore, create } from 'zustand';
import { EditorProps, createEditorSlice } from '../stores/editor';
import { ExecutionProps, createExecutionSlice } from '../stores/execution';
import { PluginProps, createPluginSlice } from '../stores/plugin';
import { SchemaProps, createSchemaSlice } from '../stores/schema';
import { StorageStore } from '../stores/storage';
import { ThemeStore } from '../stores/theme';
import { AllSlices } from '../types';
import { pick, useSynchronizeValue } from '../utility';
import { FragmentDefinitionNode, parse, visit } from 'graphql';
import { DEFAULT_PRETTIFY_QUERY } from '../constants';

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
  shouldPersistHeaders = false,
  validationRules = [],
  variables,
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

  const storeRef = useRef<GraphiQLStore>(null!);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive
  if (storeRef.current === null) {
    storeRef.current = createGraphiQLStore();
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
