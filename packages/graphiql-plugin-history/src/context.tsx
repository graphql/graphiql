// eslint-disable-next-line react/jsx-filename-extension -- TODO
import { FC, ReactNode, useEffect } from 'react';
import { createStore, useStore } from 'zustand';
import { HistoryStore, QueryStoreItem } from '@graphiql/toolkit';
import {
  useExecutionContext,
  useEditorContext,
  useStorage,
} from '@graphiql/react';

const historyStore = createStore<HistoryContextType>((set, get) => ({
  historyStorage: null!,
  // items: historyStore.queries,
  actions: {
    addToHistory(operation) {
      get().historyStorage.updateHistory(operation);
      // const items = historyStore.queries;
      // set({ items });
    },
    editLabel(operation, index) {
      get().historyStorage.editLabel(operation, index);
      // const items = historyStore.queries;
      // set({ items });
    },
    toggleFavorite(operation) {
      get().historyStorage.toggleFavorite(operation);
      // const items = historyStore.queries;
      // set({ items });
    },
    setActive: item => item,
    deleteFromHistory(item, clearFavorites) {
      get().historyStorage.deleteHistory(item, clearFavorites);
      // const items = historyStore.queries;
      // set({ items });
    },
  },
}));

type HistoryContextType = {
  /**
   * The list of history items.
   */
  // items: readonly QueryStoreItem[];
  historyStorage: HistoryStore;
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
// @ts-expect-error -- ignore `children` type warning
export const HistoryContextProvider: FC<HistoryContextProviderProps> = ({
  maxHistoryLength = 20,
  children,
}) => {
  const { isFetching } = useExecutionContext({ nonNull: true });
  const { tabs, activeTabIndex } = useEditorContext({ nonNull: true });
  const activeTab = tabs[activeTabIndex];
  const storage = useStorage();

  const historyStorage = // eslint-disable-line react-hooks/exhaustive-deps -- false positive, code is optimized by React Compiler
    new HistoryStore(storage, maxHistoryLength);

  useEffect(() => {
    historyStore.setState({ historyStorage });
  }, [historyStorage]);

  useEffect(() => {
    if (!isFetching) {
      return;
    }
    const { addToHistory } = historyStore.getState().actions;
    addToHistory({
      query: activeTab.query ?? undefined,
      variables: activeTab.variables ?? undefined,
      headers: activeTab.headers ?? undefined,
      operationName: activeTab.operationName ?? undefined,
    });
  }, [isFetching, activeTab]);

  return children;
};

function useHistoryStore<T>(selector: (state: HistoryContextType) => T): T {
  return useStore(historyStore, selector);
}

export const useHistory = () =>
  useHistoryStore(state => state.historyStorage.queries);
export const useHistoryActions = () => useHistoryStore(state => state.actions);
