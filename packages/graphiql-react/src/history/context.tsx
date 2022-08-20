import { HistoryStore, QueryStoreItem, StorageAPI } from '@graphiql/toolkit';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useStorageContext } from '../storage';
import { createContextHook, createNullableContext } from '../utility/context';

export type HistoryContextType = {
  /**
   * Add an operation to the history.
   * @param operation The operation that was executed, consisting of the query,
   * variables, headers and the operation name.
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
   */
  editLabel(args: {
    query?: string;
    variables?: string;
    headers?: string;
    operationName?: string;
    label?: string;
    favorite?: boolean;
  }): void;
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
    ({ query, variables, headers, operationName }) => {
      historyStore.current?.updateHistory(
        query,
        variables,
        headers,
        operationName,
      );
      setItems(historyStore.current.queries);
    },
    [],
  );

  const editLabel: HistoryContextType['editLabel'] = useCallback(
    ({ query, variables, headers, operationName, label, favorite }) => {
      historyStore.current.editLabel(
        query,
        variables,
        headers,
        operationName,
        label,
        favorite,
      );
      setItems(historyStore.current.queries);
    },
    [],
  );

  const toggleFavorite: HistoryContextType['toggleFavorite'] = useCallback(
    ({ query, variables, headers, operationName, label, favorite }) => {
      historyStore.current.toggleFavorite(
        query,
        variables,
        headers,
        operationName,
        label,
        favorite,
      );
      setItems(historyStore.current.queries);
    },
    [],
  );

  const value = useMemo<HistoryContextType>(
    () => ({ addToHistory, editLabel, items, toggleFavorite }),
    [addToHistory, editLabel, items, toggleFavorite],
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
