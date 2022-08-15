import { HistoryStore, QueryStoreItem, StorageAPI } from '@graphiql/toolkit';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useStorageContext } from '../storage';
import { createContextHook, createNullableContext } from '../utility/context';

export type HistoryContextType = {
  addToHistory(operation: {
    query?: string;
    variables?: string;
    headers?: string;
    operationName?: string;
  }): void;
  editLabel(args: {
    query?: string;
    variables?: string;
    headers?: string;
    operationName?: string;
    label?: string;
    favorite?: boolean;
  }): void;
  hide(): void;
  isVisible: boolean;
  items: readonly QueryStoreItem[];
  show(): void;
  toggle(): void;
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
  /**
   * Invoked when the visibility of the history UI changes.
   * @param isVisible A boolean indicating if the history is now visible
   * (`true`) or hidden (`false`).
   */
  onToggleHistory?(isVisible: boolean): void;
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
  const [isVisible, setIsVisible] = useState(
    storage?.get(STORAGE_KEY) === 'true' || false,
  );

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

  const { onToggleHistory } = props;

  const hide = useCallback(() => {
    onToggleHistory?.(false);
    storage?.set(STORAGE_KEY, JSON.stringify(false));
    setIsVisible(false);
  }, [onToggleHistory, storage]);

  const show = useCallback(() => {
    onToggleHistory?.(true);
    storage?.set(STORAGE_KEY, JSON.stringify(true));
    setIsVisible(true);
  }, [onToggleHistory, storage]);

  const toggle = useCallback(() => {
    setIsVisible(current => {
      const newValue = !current;
      onToggleHistory?.(newValue);
      storage?.set(STORAGE_KEY, JSON.stringify(newValue));
      return newValue;
    });
  }, [onToggleHistory, storage]);

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
    () => ({
      addToHistory,
      editLabel,
      hide,
      isVisible,
      items,
      show,
      toggle,
      toggleFavorite,
    }),
    [
      addToHistory,
      editLabel,
      hide,
      isVisible,
      items,
      show,
      toggle,
      toggleFavorite,
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
const STORAGE_KEY = 'historyPaneOpen';
