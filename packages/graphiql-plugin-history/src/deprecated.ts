import { useHistory, useHistoryActions } from './context';

/**
 * @deprecated Use `useHistoryActions` and `useHistory` hooks instead.
 */
export function useHistoryContext() {
  const actions = useHistoryActions();
  const items = useHistory();
  return { items, ...actions };
}
