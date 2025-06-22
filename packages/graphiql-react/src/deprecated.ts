import { useGraphiQL, useGraphiQLActions } from './components';
import { pick } from './utility';

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
export function useExecutionContext() {
  const { run, stop } = useGraphiQLActions();
  const values = useGraphiQL(state => ({
    isFetching: state.isIntrospecting,
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
  const values = useGraphiQL(
    pick('fetchError', 'isFetching', 'schema', 'validationErrors'),
  );
  return {
    introspect,
    ...values,
  };
}

/**
 * @deprecated Use `const storage = useGraphiQL(state => state.storage)` instead.
 */
export function useStorageContext() {
  return useGraphiQL(state => state.storage);
}
