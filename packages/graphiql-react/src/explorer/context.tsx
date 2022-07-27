import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from 'graphql';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSchemaContext } from '../schema';

import { useStorageContext } from '../storage';
import { createContextHook, createNullableContext } from '../utility/context';

export type ExplorerFieldDef =
  | GraphQLField<{}, {}, {}>
  | GraphQLInputField
  | GraphQLArgument;

export type ExplorerNavStackItem = {
  name: string;
  title?: string;
  def?: GraphQLNamedType | ExplorerFieldDef;
};

// There's always at least one item in the nav stack
export type ExplorerNavStack = [
  ExplorerNavStackItem,
  ...ExplorerNavStackItem[]
];

const initialNavStackItem: ExplorerNavStackItem = {
  name: 'Schema',
  title: 'Docs',
};

export type ExplorerContextType = {
  explorerNavStack: ExplorerNavStack;
  hide(): void;
  isVisible: boolean;
  push(item: ExplorerNavStackItem): void;
  pop(): void;
  reset(): void;
  show(): void;
};

export const ExplorerContext = createNullableContext<ExplorerContextType>(
  'ExplorerContext',
);

type ExplorerContextProviderProps = {
  children: ReactNode;
  isVisible?: boolean;
  onToggleVisibility?(isVisible: boolean): void;
};

export function ExplorerContextProvider(props: ExplorerContextProviderProps) {
  const { isFetching } = useSchemaContext({
    nonNull: true,
    caller: ExplorerContextProvider,
  });
  const storage = useStorageContext();

  const [isVisible, setIsVisible] = useState(
    props.isVisible ?? storage?.get(STORAGE_KEY) === 'true' ?? false,
  );
  const [navStack, setNavStack] = useState<ExplorerNavStack>([
    initialNavStackItem,
  ]);

  const { onToggleVisibility } = props;

  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
    } else if (props.isVisible !== undefined) {
      setIsVisible(props.isVisible);
    }
  }, [props.isVisible]);

  const hide = useCallback(() => {
    onToggleVisibility?.(false);
    storage?.set(STORAGE_KEY, 'false');
    setIsVisible(false);
  }, [onToggleVisibility, storage]);

  const push = useCallback((item: ExplorerNavStackItem) => {
    setNavStack(currentState => {
      const lastItem = currentState[currentState.length - 1];
      return lastItem.def === item.def
        ? // Avoid pushing duplicate items
          currentState
        : [...currentState, item];
    });
  }, []);

  const pop = useCallback(() => {
    setNavStack(currentState =>
      currentState.length > 1
        ? (currentState.slice(0, -1) as ExplorerNavStack)
        : currentState,
    );
  }, []);

  const reset = useCallback(() => {
    setNavStack(currentState =>
      currentState.length === 1 ? currentState : [initialNavStackItem],
    );
  }, []);

  const show = useCallback(() => {
    onToggleVisibility?.(true);
    storage?.set(STORAGE_KEY, 'true');
    setIsVisible(true);
  }, [onToggleVisibility, storage]);

  useEffect(() => {
    if (isFetching) {
      reset();
    }
  }, [isFetching, reset]);

  const value = useMemo<ExplorerContextType>(
    () => ({
      explorerNavStack: navStack,
      hide,
      isVisible,
      push,
      pop,
      reset,
      show,
    }),
    [hide, isVisible, navStack, push, pop, reset, show],
  );

  return (
    <ExplorerContext.Provider value={value}>
      {props.children}
    </ExplorerContext.Provider>
  );
}

export const useExplorerContext = createContextHook(ExplorerContext);

const STORAGE_KEY = 'docExplorerOpen';
