/* eslint-disable @typescript-eslint/no-deprecated */

import { useGraphiQL, useGraphiQLActions } from './components';
import { pick } from './utility';
import type { MonacoEditor } from './types';

/**
 * @deprecated Use `const { prettifyEditors } = useGraphiQLActions()` instead.
 */
export function usePrettifyEditors() {
  const { prettifyEditors } = useGraphiQLActions();
  return prettifyEditors;
}

/**
 * @deprecated Use `const { copyQuery } = useGraphiQLActions()` instead.
 */
export function useCopyQuery() {
  const { copyQuery } = useGraphiQLActions();
  return copyQuery;
}

/**
 * @deprecated Use `const { mergeQuery } = useGraphiQLActions()` instead.
 */
export function useMergeQuery() {
  const { mergeQuery } = useGraphiQLActions();
  return mergeQuery;
}

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export function useEditorContext() {
  const {
    addTab,
    changeTab,
    moveTab,
    closeTab,
    updateActiveTabValues,
    setEditor,
    setOperationName,
    setShouldPersistHeaders,
  } = useGraphiQLActions();

  const setHeaderEditor = (headerEditor: MonacoEditor) =>
    setEditor({ headerEditor });
  const setQueryEditor = (queryEditor: MonacoEditor) =>
    setEditor({ queryEditor });
  const setResponseEditor = (responseEditor: MonacoEditor) =>
    setEditor({ responseEditor });
  const setVariableEditor = (variableEditor: MonacoEditor) =>
    setEditor({ variableEditor });

  const values = useGraphiQL(
    pick(
      'headerEditor',
      'queryEditor',
      'responseEditor',
      'variableEditor',
      'initialHeaders',
      'initialQuery',
      'initialVariables',
      'externalFragments',
      'shouldPersistHeaders',
    ),
  );
  return {
    addTab,
    changeTab,
    moveTab,
    closeTab,
    updateActiveTabValues,
    setHeaderEditor,
    setQueryEditor,
    setResponseEditor,
    setVariableEditor,
    setOperationName,
    setShouldPersistHeaders,
    ...values,
  };
}

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export function useExecutionContext() {
  const { run, stop } = useGraphiQLActions();
  const values = useGraphiQL(state => ({
    isFetching: state.isFetching,
    isSubscribed: Boolean(state.subscription),
    operationName: state.operationName,
  }));
  return {
    run,
    stop,
    ...values,
  };
}

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export function usePluginContext() {
  const { setVisiblePlugin } = useGraphiQLActions();
  const values = useGraphiQL(pick('plugins', 'visiblePlugin'));
  return {
    setVisiblePlugin,
    ...values,
  };
}

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export function useSchemaContext() {
  const { introspect } = useGraphiQLActions();
  const values = useGraphiQL(state => ({
    isFetching: state.isIntrospecting,
    fetchError: state.fetchError,
    schema: state.schema,
    validationErrors: state.validationErrors,
  }));
  return {
    introspect,
    ...values,
  };
}

/**
 * @deprecated Use `const storage = useGraphiQL(state => state.storage)` instead.
 */
export const useStorage = () => useGraphiQL(state => state.storage);

/**
 * @deprecated Use `const storage = useGraphiQL(state => state.storage)` instead.
 */
export const useStorageContext = useStorage;

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export function useTheme() {
  const { setTheme } = useGraphiQLActions();
  const theme = useGraphiQL(state => state.theme);
  return {
    setTheme,
    theme,
  };
}

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export const useEditorStore = useEditorContext;

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export const useExecutionStore = useExecutionContext;

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export const usePluginStore = usePluginContext;

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export const useSchemaStore = useSchemaContext;
