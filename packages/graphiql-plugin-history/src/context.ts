import { FC, ReactElement, ReactNode, useEffect } from 'react';
import { createStore } from 'zustand';
import {
  HistoryStore as ToolkitHistoryStore,
  QueryStoreItem,
} from '@graphiql/toolkit';
import { useGraphiQL, pick, createBoundedUseStore } from '@graphiql/react';

const historyStore = createStore<HistoryStoreType>((set, get) => ({
  historyStorage: null,
  actions: {
    addToHistory(operation) {
      const { historyStorage } = get();
      historyStorage?.updateHistory(operation);
      set({}); // trigger rerender
    },
    editLabel(operation, index) {
      const { historyStorage } = get();
      historyStorage?.editLabel(operation, index);
      set({}); // trigger rerender
    },
    toggleFavorite(operation) {
      const { historyStorage } = get();
      historyStorage?.toggleFavorite(operation);
      set({}); // trigger rerender
    },
    setActive: item => item,
    deleteFromHistory(item, clearFavorites) {
      const { historyStorage } = get();
      historyStorage?.deleteHistory(item, clearFavorites);
      set({}); // trigger rerender
    },
  },
}));

type HistoryStoreType = {
  // Can be `null` if History plugin saved in `localStorage` as `visiblePlugin`
  historyStorage: ToolkitHistoryStore | null;
  actions: {
    /**
     * Add an operation to the history.
     * @param operation - The operation that was executed, consisting of the query,
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
     * @param args - An object containing the label (`undefined` if it should be
     * unset) and properties that identify the history item that the label should
     * be applied to. (This can result in the label being applied to multiple
     * history items.)
     * @param index - Index to edit. Without it, will look for the first index matching the
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
     * @param args - The operation that was executed, consisting of the query,
     * variables, headers, and operation name.
     * @param clearFavorites - This is only if you press the 'clear' button
     */
    deleteFromHistory(args: QueryStoreItem, clearFavorites?: boolean): void;
    /**
     * If you need to know when an item in history is set as active to customize
     * your application.
     */
    setActive(args: QueryStoreItem): void;
  };
};

type HistoryStoreProps = {
  children: ReactNode;
  /**
   * The maximum number of executed operations to store.
   * @default 20
   */
  maxHistoryLength?: number;
};

/**
 * The functions send the entire operation so users can customize their own application and get
 * access to the operation plus any additional props they added for their needs (i.e., build their
 * own functions that may save to a backend instead of localStorage and might need an id property
 * added to the `QueryStoreItem`)
 */
export const HistoryStore: FC<HistoryStoreProps> = ({
  maxHistoryLength = 20,
  children,
}) => {
  const { isFetching, tabs, activeTabIndex } = useGraphiQL(
    pick('isFetching', 'tabs', 'activeTabIndex'),
  );
  const activeTab = tabs[activeTabIndex]!;
  const storage = useGraphiQL(state => state.storage);

  const historyStorage = // eslint-disable-line react-hooks/exhaustive-deps -- false positive, code is optimized by React Compiler
    new ToolkitHistoryStore(storage, maxHistoryLength);

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

  return children as ReactElement;
};

const useHistoryStore = createBoundedUseStore(historyStore);

const EMPTY_ARRAY: QueryStoreItem[] = [];

export const useHistory = () =>
  useHistoryStore(state => state.historyStorage?.queries ?? EMPTY_ARRAY);

/**
 * Actions are functions used to update values in your store. They are static and never change.
 * @see https://tkdodo.eu/blog/working-with-zustand#separate-actions-from-state
 */
export const useHistoryActions = () => useHistoryStore(state => state.actions);
