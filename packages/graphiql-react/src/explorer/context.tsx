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
  /**
   * The name of the item.
   */
  name: string;
  /**
   * The definition object of the item, this can be a named type, a field, an
   * input field or an argument.
   */
  def?: GraphQLNamedType | ExplorerFieldDef;
};

// There's always at least one item in the nav stack
export type ExplorerNavStack = [
  ExplorerNavStackItem,
  ...ExplorerNavStackItem[],
];

const initialNavStackItem: ExplorerNavStackItem = { name: 'Docs' };

export type ExplorerContextType = {
  /**
   * A stack of navigation items. The last item in the list is the current one.
   * This list always contains at least one item.
   */
  explorerNavStack: ExplorerNavStack;
  /**
   * Hide the doc explorer.
   */
  hide(): void;
  /**
   * If the doc explorer should be shown.
   */
  isVisible: boolean;
  /**
   * Push an item to the navigation stack.
   * @param item The item that should be pushed to the stack.
   */
  push(item: ExplorerNavStackItem): void;
  /**
   * Pop the last item from the navigation stack.
   */
  pop(): void;
  /**
   * Reset the navigation stack to its initial state, this will remove all but
   * the initial stack item.
   */
  reset(): void;
  /**
   * Show the doc explorer.
   */
  show(): void;
};

export const ExplorerContext =
  createNullableContext<ExplorerContextType>('ExplorerContext');

export type ExplorerContextProviderProps = {
  children: ReactNode;
  /**
   * This prop controls the visibility state of the doc explorer.
   */
  isDocExplorerVisible?: boolean;
  /**
   * Invoked when the visibility state of the doc explorer changes.
   * @param isVisible The new visibility state of the doc explorer after the
   * update.
   */
  onToggleDocExplorerVisibility?(isVisible: boolean): void;
};

export function ExplorerContextProvider(props: ExplorerContextProviderProps) {
  const { isFetching } = useSchemaContext({
    nonNull: true,
    caller: ExplorerContextProvider,
  });
  const storage = useStorageContext();

  const [isVisible, setIsVisible] = useState(
    props.isDocExplorerVisible ?? storage?.get(STORAGE_KEY) === 'true' ?? false,
  );
  const [navStack, setNavStack] = useState<ExplorerNavStack>([
    initialNavStackItem,
  ]);

  const { onToggleDocExplorerVisibility: onToggleVisibility } = props;

  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
    } else if (props.isDocExplorerVisible !== undefined) {
      setIsVisible(props.isDocExplorerVisible);
    }
  }, [props.isDocExplorerVisible]);

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
