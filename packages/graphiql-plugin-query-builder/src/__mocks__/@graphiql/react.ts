// Minimal stub of @graphiql/react for unit/integration tests.
// Tests that need to control the state should override these module-level
// variables before rendering.
import type { ReactNode } from 'react';

type Selector<T> = (state: {
  schema: unknown;
  queryEditor: unknown;
  variableEditor: null;
  activeTabIndex: number;
  tabs: { query: string; variables?: string }[];
  operationName: string | undefined;
}) => T;

// Mutable state that tests can override.
export const __state = {
  schema: null as unknown,
  queryText: '{ __typename }',
  variablesText: undefined as string | undefined,
  operationName: undefined as string | undefined,
  // Tests that exercise editor-cursor behavior set a stub editor here; left null
  // otherwise so the builder falls back to updateActiveTabValues.
  queryEditor: null as unknown,
  updateActiveTabValues(_values: { query?: string; variables?: string }) {},
};

export function useGraphiQL<T>(selector: Selector<T>): T {
  return selector({
    schema: __state.schema,
    queryEditor: __state.queryEditor,
    variableEditor: null,
    activeTabIndex: 0,
    tabs: [{ query: __state.queryText, variables: __state.variablesText }],
    operationName: __state.operationName,
  });
}

export const useGraphiQLActions = () => ({
  updateActiveTabValues: __state.updateActiveTabValues,
});

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

export const MagnifyingGlassIcon = () => null;
export const ChevronDownIcon = () => null;
export const ChevronUpIcon = () => null;
export const CloseIcon = () => null;
export const PlusIcon = () => null;
