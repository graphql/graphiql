import { createStore, StoreApi, useStore } from 'zustand';
import { HistoryStore, QueryStoreItem, StorageAPI } from '@graphiql/toolkit';
import { FC, ReactNode, useEffect } from 'react';
import {
  useStorageContext,
  useExecutionContext,
  useEditorContext,
} from '@graphiql/react';

function createHistoryStore(
  storage: StorageAPI | null,
  maxHistoryLength: number,
) {
  const historyStore =
    // Fall back to a noop storage when the StorageContext is empty
    new HistoryStore(storage || new StorageAPI(null), maxHistoryLength);

  return createStore<HistoryContextType>(set => ({
    items: historyStore.queries,
    actions: {
      addToHistory(operation) {
        historyStore.updateHistory(operation);
        const items = historyStore.queries;
        set({ items });
      },
      editLabel(operation, index) {
        historyStore.editLabel(operation, index);
        const items = historyStore.queries;
        set({ items });
      },
      toggleFavorite(operation) {
        historyStore.toggleFavorite(operation);
        const items = historyStore.queries;
        set({ items });
      },
      setActive: item => item,
      deleteFromHistory(item, clearFavorites) {
        historyStore.deleteHistory(item, clearFavorites);
        const items = historyStore.queries;
        set({ items });
      },
    },
  }));
}

type HistoryContextType = {
  /**
   * The list of history items.
   */
  items: readonly QueryStoreItem[];
  actions: {
    /**
     * Add an operation to the history.
     * @param operation The operation that was executed, consisting of the query,
     * variables, headers, and operation name.
     */
    addToHistory(operation: {
      query?: string;
      variables?: string;
      headers?: string;
      operationName?: string;
    }): void;
    /**
     * Change the custom label of an item from the history.
     * @param args An object containing the label (`undefined` if it should be
     * unset) and properties that identify the history item that the label should
     * be applied to. (This can result in the label being applied to multiple
     * history items.)
     * @param index Index to edit. Without it, will look for the first index matching the
     * operation, which may lead to misleading results if multiple items have the same label
     */
    editLabel(
      args: {
        query?: string;
        variables?: string;
        headers?: string;
        operationName?: string;
        label?: string;
        favorite?: boolean;
      },
      index?: number,
    ): void;
    /**
     * Toggle the favorite state of an item from the history.
     * @param args An object containing the favorite state (`undefined` if it
     * should be unset) and properties that identify the history item that the
     * label should be applied to. (This can result in the label being applied
     * to multiple history items.)
     */
    toggleFavorite(args: {
      query?: string;
      variables?: string;
      headers?: string;
      operationName?: string;
      label?: string;
      favorite?: boolean;
    }): void;
    /**
     * Delete an operation from the history.
     * @param args The operation that was executed, consisting of the query,
     * variables, headers, and operation name.
     * @param clearFavorites This is only if you press the 'clear' button
     */
    deleteFromHistory(args: QueryStoreItem, clearFavorites?: boolean): void;
    /**
     * If you need to know when an item in history is set as active to customize
     * your application.
     */
    setActive(args: QueryStoreItem): void;
  };
};

const HistoryContext = createContext<RefObject<
  StoreApi<HistoryContextType>
> | null>(null);

type HistoryContextProviderProps = {
  children: ReactNode;
  /**
   * The maximum number of executed operations to store.
   * @default 20
   */
  maxHistoryLength?: number;
};

/**
 * The functions send the entire operation so users can customize their own application with
 * <HistoryContext.Provider value={customizedFunctions} /> and get access to the operation plus
 * any additional props they added for their needs (i.e., build their own functions that may save
 * to a backend instead of localStorage and might need an id property added to the QueryStoreItem)
 */
export const HistoryContextProvider: FC<HistoryContextProviderProps> = ({
  maxHistoryLength = 20,
  children,
}) => {
  const storage = useStorageContext();
  const { isFetching } = useExecutionContext({ nonNull: true });
  const { tabs, activeTabIndex } = useEditorContext({ nonNull: true });
  const activeTab = tabs[activeTabIndex];
  const storeRef = useRef<StoreApi<HistoryContextType>>(null!);

  if (storeRef.current === null) {
    storeRef.current = createHistoryStore(storage, maxHistoryLength);
  }

  useEffect(() => {
    if (!isFetching) {
      return;
    }
    const { addToHistory } = storeRef.current.getState().actions;
    addToHistory({
      query: activeTab.query ?? undefined,
      variables: activeTab.variables ?? undefined,
      headers: activeTab.headers ?? undefined,
      operationName: activeTab.operationName ?? undefined,
    });
  }, [isFetching, activeTab]);

  return (
    <HistoryContext.Provider value={storeRef}>
      {children}
    </HistoryContext.Provider>
  );
};

function useHistoryStore<T>(selector: (state: HistoryContextType) => T): T {
  const store = useContext(HistoryContext);
  if (!store) {
    throw new Error('Missing `HistoryContextProvider` in the tree');
  }
  return useStore(store.current, selector);
}

export const useHistory = () => useHistoryStore(state => state.items);
export const useHistoryActions = () => useHistoryStore(state => state.actions);
