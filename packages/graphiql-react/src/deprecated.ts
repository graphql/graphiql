import { useGraphiQL, useGraphiQLActions } from './components';
import { pick } from './utility';
import { useStorage } from './stores';

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
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
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
 * @deprecated Use `useGraphiQLActions` and `useGraphiQL` hooks instead.
 */
export function useSchemaContext() {
  const values = useGraphiQL(
    pick('fetchError', 'isFetching', 'schema', 'validationErrors'),
  );
  const { introspect } = useGraphiQLActions();
  return {
    ...values,
    introspect,
  };
}

/**
 * @deprecated Use `const { storage } = useStorage()` instead.
 */
export function useStorageContext() {
  const { storage } = useStorage();
  return storage;
}
