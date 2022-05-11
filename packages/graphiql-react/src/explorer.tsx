import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from 'graphql';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

export type ExplorerFieldDef =
  | GraphQLField<{}, {}, {}>
  | GraphQLInputField
  | GraphQLArgument;

export type ExplorerNavStackItem = {
  name: string;
  title?: string;
  search?: string;
  def?: GraphQLNamedType | ExplorerFieldDef;
};

// There's always at least one item in the nav stack
export type ExplorerNavStack = [
  ExplorerNavStackItem,
  ...ExplorerNavStackItem[]
];

const initialNavStackItem: ExplorerNavStackItem = {
  name: 'Schema',
  title: 'Documentation Explorer',
};

export type ExplorerContextType = {
  explorerNavStack: ExplorerNavStack;
  push(item: ExplorerNavStackItem): void;
  pop(): void;
  reset(): void;
  showSearch(search: string): void;
};

export const ExplorerContext = createContext<ExplorerContextType>(null as any);

export function ExplorerContextProvider(props: { children: ReactNode }) {
  const [state, setState] = useState<ExplorerNavStack>([initialNavStackItem]);

  const push = useCallback((item: ExplorerNavStackItem) => {
    setState(currentState => {
      const lastItem = currentState[currentState.length - 1];
      return lastItem.def === item.def
        ? // Avoid pushing duplicate items
          currentState
        : [...currentState, item];
    });
  }, []);

  const pop = useCallback(() => {
    setState(currentState =>
      currentState.length > 1
        ? (currentState.slice(0, -1) as ExplorerNavStack)
        : currentState,
    );
  }, []);

  const reset = useCallback(() => {
    setState(currentState =>
      currentState.length === 1 ? currentState : [initialNavStackItem],
    );
  }, []);

  const showSearch = useCallback((search: string) => {
    setState(currentState => {
      const lastItem = currentState[currentState.length - 1];
      const allButLastItem = currentState.slice(0, -1) as ExplorerNavStack;
      return [...allButLastItem, { ...lastItem, search }] as ExplorerNavStack;
    });
  }, []);

  return (
    <ExplorerContext.Provider
      value={{ explorerNavStack: state, push, pop, reset, showSearch }}>
      {props.children}
    </ExplorerContext.Provider>
  );
}

export function useExplorerNavStack() {
  return useContext(ExplorerContext);
}
