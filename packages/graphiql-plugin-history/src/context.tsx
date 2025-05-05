import { HistoryStore, QueryStoreItem, StorageAPI } from '@graphiql/toolkit';
import { FC, ReactNode, useEffect, useState } from 'react';
import {
  useStorageContext,
  createNullableContext,
  createContextHook,
  useExecutionContext,
  useEditorContext,
} from '@graphiql/react';

export type HistoryContextType = {
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
   * The list of history items.
   */
  items: readonly QueryStoreItem[];
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

export const HistoryContext =
  createNullableContext<HistoryContextType>('HistoryContext');

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
  maxHistoryLength = DEFAULT_HISTORY_LENGTH,
  children,
}) => {
  const storage = useStorageContext();
  const { isFetching } = useExecutionContext({ nonNull: true });
  const [historyStore] = useState(
    () =>
      // Fall back to a noop storage when the StorageContext is empty
      new HistoryStore(storage || new StorageAPI(null), maxHistoryLength),
  );
  const [items, setItems] = useState(() => historyStore.queries || []);

  const value: HistoryContextType = {
    addToHistory(operation) {
      historyStore.updateHistory(operation);
      setItems(historyStore.queries);
    },
    editLabel(operation, index) {
      historyStore.editLabel(operation, index);
      setItems(historyStore.queries);
    },
    items,
    toggleFavorite(operation) {
      historyStore.toggleFavorite(operation);
      setItems(historyStore.queries);
    },
    setActive: item => item,
    deleteFromHistory(item, clearFavorites) {
      historyStore.deleteHistory(item, clearFavorites);
      setItems(historyStore.queries);
    },
  };
  const { tabs, activeTabIndex } = useEditorContext({ nonNull: true });
  const activeTab = tabs[activeTabIndex];
  const { addToHistory } = value;

  useEffect(() => {
    if (!isFetching) {
      return;
    }
    addToHistory({
      query: activeTab.query ?? undefined,
      variables: activeTab.variables ?? undefined,
      headers: activeTab.headers ?? undefined,
      operationName: activeTab.operationName ?? undefined,
    });
  }, [isFetching, activeTab, addToHistory]);

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
};

export const useHistoryContext =
  createContextHook<HistoryContextType>(HistoryContext);

const DEFAULT_HISTORY_LENGTH = 20;
