/**
 * Shared test helper: wires up vi.fn() mocks for useGraphiQL and
 * useGraphiQLActions (imported from the REAL '@graphiql/react') to read from a
 * mutable __state object, replicating the old hand-written module mock.
 *
 * Usage in each test file:
 *   1. Add a top-level vi.mock('@graphiql/react', ...) that spreads the real
 *      module and replaces useGraphiQL / useGraphiQLActions with vi.fn().
 *   2. Import { __state, installGraphiQLReactMock } from this file.
 *   3. Call installGraphiQLReactMock() inside beforeEach (or at the top of any
 *      setup function) so the mock implementations are wired before the test
 *      mutates __state and renders.
 */
import { type Mock } from 'vitest';
import { useGraphiQL, useGraphiQLActions } from '@graphiql/react';

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

/**
 * Wire the vi.fn() mocks to read __state live. Call this inside beforeEach
 * (before mutating __state or rendering) in each test file that uses the mock.
 */
export function installGraphiQLReactMock() {
  (useGraphiQL as Mock).mockImplementation(
    (
      selector: (state: {
        schema: unknown;
        queryEditor: unknown;
        variableEditor: null;
        activeTabIndex: number;
        tabs: { query: string; variables?: string }[];
        operationName: string | undefined;
      }) => unknown,
    ) =>
      selector({
        schema: __state.schema,
        queryEditor: __state.queryEditor,
        variableEditor: null,
        activeTabIndex: 0,
        tabs: [{ query: __state.queryText, variables: __state.variablesText }],
        operationName: __state.operationName,
      }),
  );

  (useGraphiQLActions as Mock).mockImplementation(() => ({
    updateActiveTabValues: (v: { query?: string; variables?: string }) =>
      __state.updateActiveTabValues(v),
  }));
}
