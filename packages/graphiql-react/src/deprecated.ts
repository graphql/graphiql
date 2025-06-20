import { useGraphiQL, useGraphiQLActions } from './components';

/**
 * @deprecated Use `const { prettifyEditors } = useGraphiQLActions()`
 */
export function usePrettifyEditors() {
  const { prettifyEditors } = useGraphiQLActions();
  return prettifyEditors;
}

/**
 * @deprecated Use `const { copyQuery } = useGraphiQLActions()`
 */
export function useCopyQuery() {
  const { copyQuery } = useGraphiQLActions();
  return copyQuery;
}

/**
 * @deprecated Use `const { mergeQuery } = useGraphiQLActions()`
 */
export function useMergeQuery() {
  const { mergeQuery } = useGraphiQLActions();
  return mergeQuery;
}

/**
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks
 */
export function useExecutionContext() {
  const { run, stop } = useGraphiQLActions();
  const values = useGraphiQL(state => ({
    isFetching: state.isIntrospecting,
    isSubscribed: Boolean(state.subscription),
    operationName: state.operationName,
  }));
  return {
    ...values,
    run,
    stop,
  };
}

/**
 * @deprecated Use ``
 */
export function useExplorerContext() {}

/**
 * @deprecated Use ``
 */
export function useHistoryContext() {}

/**
 * @deprecated Use ``
 */
export function usePluginContext() {}

/**
 * @deprecated Use ``
 */
export function useSchemaContext() {}

/**
 * @deprecated Use ``
 */
export function useStorageContext() {}
