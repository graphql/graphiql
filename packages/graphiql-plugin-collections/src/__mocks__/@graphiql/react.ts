// Minimal stub of @graphiql/react for unit/integration tests.
import { createElement } from 'react';
import type { MouseEventHandler, ReactNode } from 'react';

export type Operation = 'query' | 'mutation' | 'subscription';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type { StoreApi, ExtractState } from 'zustand';

type GraphiQLState = {
  schema: unknown;
  queryEditor: null;
  activeTabIndex: number;
  tabs: { query: string; variables?: string; headers?: string }[];
};

type Selector<T> = (state: GraphiQLState) => T;

// Mutable state that tests can override.
export const __state = {
  schema: null as unknown,
  queryText: '{ __typename }',
  addTab() {},
  updateActiveTabValues(_values: {
    query?: string;
    variables?: string;
    headers?: string;
  }) {},
};

export function useGraphiQL<T>(selector: Selector<T>): T {
  return selector({
    schema: __state.schema,
    queryEditor: null,
    activeTabIndex: 0,
    tabs: [{ query: __state.queryText }],
  });
}

export const useGraphiQLActions = () => ({
  addTab: __state.addTab,
  updateActiveTabValues: __state.updateActiveTabValues,
  markTabSaved(_tabId: string) {},
});

export const pick =
  <K extends string>(...keys: K[]) =>
  (state: Record<string, unknown>) =>
    Object.fromEntries(keys.map(k => [k, state[k]]));

export const createBoundedUseStore = ((store: StoreApi<unknown>) =>
  (selector?: (state: unknown) => unknown) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStore(store, selector ? useShallow(selector) : (s: unknown) => s);
  }) as <S extends StoreApi<unknown>>(
  store: S,
) => {
  (): ExtractState<S>;
  <T>(selector: (state: ExtractState<S>) => T): T;
};

export const GraphiQLProvider = ({ children }: { children: ReactNode }) =>
  children;

export const PanelHeader = ({
  title: _title,
  subtitle: _subtitle,
  actions: _actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => null;

export const MethodPill = ({ operation: _operation }: { operation: string }) =>
  null;

export const Dialog = Object.assign(
  ({
    children,
    open: _open,
    onOpenChange: _onOpenChange,
  }: {
    children?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => children ?? null,
  {
    Title: ({ children }: { children: ReactNode }) => children,
    Close: ({ children }: { children: ReactNode }) => children,
    Description: ({ children }: { children: ReactNode }) => children,
    Trigger: ({ children }: { children: ReactNode }) => children,
    Header: ({ children }: { children: ReactNode }) => children,
    Body: ({ children }: { children: ReactNode }) => children,
    Footer: ({ children }: { children: ReactNode }) => children,
  },
);

export const Button = ({
  children,
  onClick,
  type,
}: {
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  variant?: string;
  state?: string;
  className?: string;
}) => createElement('button', { type: type ?? 'button', onClick }, children);

export const DropdownMenu = Object.assign(
  ({ children }: { children?: ReactNode }) => children ?? null,
  {
    Button: ({ children }: { children: ReactNode }) => children,
    Content: ({ children }: { children: ReactNode }) => children,
    Item: ({
      children,
      onSelect,
    }: {
      children: ReactNode;
      onSelect?: () => void;
    }) =>
      // Real Radix renders the menu in a portal, so item clicks never reach the
      // triggering row. Stop propagation here to mirror that in the mock DOM.
      createElement(
        'button',
        {
          type: 'button',
          onClick(e: { stopPropagation(): void }) {
            e.stopPropagation();
            onSelect?.();
          },
        },
        children,
      ),
    Separator: () => null,
  },
);

export const ChevronDownIcon = () => null;
export const ChevronUpIcon = () => null;
export const MagnifyingGlassIcon = () => null;
