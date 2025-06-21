import { useDocExplorer, useDocExplorerActions } from './context';

/**
 * @deprecated Use `useDocExplorerActions` and `useDocExplorer` hooks instead.
 */
export function useExplorerContext() {
  const actions = useDocExplorerActions();
  const explorerNavStack = useDocExplorer();
  return {
    ...actions,
    explorerNavStack,
  };
}
