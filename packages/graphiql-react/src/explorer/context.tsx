import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from 'graphql';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useSchemaContext } from '../schema';
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
};

export const ExplorerContext =
  createNullableContext<ExplorerContextType>('ExplorerContext');

export type ExplorerContextProviderProps = {
  children: ReactNode;
};

export function ExplorerContextProvider(props: ExplorerContextProviderProps) {
  const { isFetching } = useSchemaContext({
    nonNull: true,
    caller: ExplorerContextProvider,
  });

  const [navStack, setNavStack] = useState<ExplorerNavStack>([
    initialNavStackItem,
  ]);

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

  useEffect(() => {
    if (isFetching) {
      reset();
    }
  }, [isFetching, reset]);

  const value = useMemo<ExplorerContextType>(
    () => ({ explorerNavStack: navStack, push, pop, reset }),
    [navStack, push, pop, reset],
  );

  return (
    <ExplorerContext.Provider value={value}>
      {props.children}
    </ExplorerContext.Provider>
  );
}

export const useExplorerContext = createContextHook(ExplorerContext);
