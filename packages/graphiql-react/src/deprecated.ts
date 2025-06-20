import { useGraphiQL, useGraphiQLActions } from './components';
import { pick } from './utility';

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
  const values = useGraphiQL(state => ({
    isFetching: state.isIntrospecting,
    isSubscribed: Boolean(state.subscription),
    operationName: state.operationName,
  }));
  const { run, stop } = useGraphiQLActions();
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
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks
 */
export function usePluginContext() {
  const values = useGraphiQL(pick('plugins', 'visiblePlugin'));
  const { setVisiblePlugin } = useGraphiQLActions();
  return {
    ...values,
    setVisiblePlugin,
  };
}

/**
 * @deprecated Use ``
 */
export function useSchemaContext() {}

/**
 * @deprecated Use ``
 */
export function useStorageContext() {}
