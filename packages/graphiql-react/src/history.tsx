import { HistoryStore, QueryStoreItem, StorageAPI } from '@graphiql/toolkit';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { StorageContext } from './storage';

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
  toggleFavorite(args: {
    query?: string;
    variables?: string;
    headers?: string;
    operationName?: string;
    label?: string;
    favorite?: boolean;
  }): void;
};

export const HistoryContext = createContext<HistoryContextType | null>(null);

type HistoryContextProviderProps = {
  children: ReactNode;
  maxHistoryLength?: number;
  onToggle?(isOpen: boolean): void;
};

export function HistoryContextProvider(props: HistoryContextProviderProps) {
  const storage = useContext(StorageContext);
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

  const { onToggle } = props;

  const hide = useCallback(() => {
    onToggle?.(false);
    storage?.set(STORAGE_KEY, JSON.stringify(false));
    setIsVisible(false);
  }, [onToggle, storage]);

  const show = useCallback(() => {
    onToggle?.(true);
    storage?.set(STORAGE_KEY, JSON.stringify(true));
    setIsVisible(true);
  }, [onToggle, storage]);

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
      toggleFavorite,
    }),
    [addToHistory, editLabel, hide, isVisible, items, show, toggleFavorite],
  );

  return (
    <HistoryContext.Provider value={value}>
      {props.children}
    </HistoryContext.Provider>
  );
}

const DEFAULT_HISTORY_LENGTH = 20;
const STORAGE_KEY = 'historyPaneOpen';
