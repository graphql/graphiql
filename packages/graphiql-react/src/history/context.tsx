import { HistoryStore, QueryStoreItem, StorageAPI } from '@graphiql/toolkit';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useStorageContext } from '../storage';
import { createContextHook, createNullableContext } from '../utility/context';

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

export type HistoryContextProviderProps = {
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
export function HistoryContextProvider(props: HistoryContextProviderProps) {
  const storage = useStorageContext();
  const historyStore = useRef(
    new HistoryStore(
      // Fall back to a noop storage when the StorageContext is empty
      storage || new StorageAPI(null),
      props.maxHistoryLength || DEFAULT_HISTORY_LENGTH,
    ),
  );
  const [items, setItems] = useState(historyStore.current?.queries || []);

  const addToHistory: HistoryContextType['addToHistory'] = useCallback(
    (operation: QueryStoreItem) => {
      historyStore.current?.updateHistory(operation);
      setItems(historyStore.current.queries);
    },
    [],
  );

  const editLabel: HistoryContextType['editLabel'] = useCallback(
    (operation: QueryStoreItem, index?: number) => {
      historyStore.current.editLabel(operation, index);
      setItems(historyStore.current.queries);
    },
    [],
  );

  const toggleFavorite: HistoryContextType['toggleFavorite'] = useCallback(
    (operation: QueryStoreItem) => {
      historyStore.current.toggleFavorite(operation);
      setItems(historyStore.current.queries);
    },
    [],
  );

  const setActive: HistoryContextType['setActive'] = useCallback(
    (item: QueryStoreItem) => {
      return item;
    },
    [],
  );

  const deleteFromHistory: HistoryContextType['deleteFromHistory'] =
    useCallback((item: QueryStoreItem, clearFavorites = false) => {
      historyStore.current.deleteHistory(item, clearFavorites);
      setItems(historyStore.current.queries);
    }, []);

  const value = useMemo<HistoryContextType>(
    () => ({
      addToHistory,
      editLabel,
      items,
      toggleFavorite,
      setActive,
      deleteFromHistory,
    }),
    [
      addToHistory,
      editLabel,
      items,
      toggleFavorite,
      setActive,
      deleteFromHistory,
    ],
  );

  return (
    <HistoryContext.Provider value={value}>
      {props.children}
    </HistoryContext.Provider>
  );
}

export const useHistoryContext =
  createContextHook<HistoryContextType>(HistoryContext);

const DEFAULT_HISTORY_LENGTH = 20;
