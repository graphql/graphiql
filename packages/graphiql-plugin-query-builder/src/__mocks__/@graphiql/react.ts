// Minimal stub of @graphiql/react for unit/integration tests.
// Tests that need to control the state should override these module-level
// variables before rendering.
import type { ReactNode } from 'react';

type Selector<T> = (state: {
  schema: unknown;
  queryEditor: null;
  activeTabIndex: number;
  tabs: { query: string }[];
}) => T;

// Mutable state that tests can override.
export const __state = {
  schema: null as unknown,
  queryText: '{ __typename }',
  updateActiveTabValues(_values: { query?: string }) {},
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
  updateActiveTabValues: __state.updateActiveTabValues,
});

export const GraphiQLProvider = ({ children }: { children: ReactNode }) => children;
