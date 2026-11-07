/**
 * Shared test helper: wires the vi.fn() mocks for useGraphiQL and
 * useGraphiQLActions (imported from the REAL '@graphiql/react') to read from a
 * per-test state object.
 *
 * Each call to installGraphiQLReactMock() builds a fresh state object and
 * returns it, so there is no module-level mutable state to leak between tests.
 * The mocks read the returned object live, so a test can mutate it (or have the
 * builder write back into it) and a re-render observes the new values.
 *
 * Usage in each test file:
 *   1. Add a top-level vi.mock('@graphiql/react', ...) that spreads the real
 *      module and replaces useGraphiQL / useGraphiQLActions with vi.fn().
 *   2. Import { installGraphiQLReactMock } from this file.
 *   3. Call it in beforeEach (or a setup function) and keep the returned object;
 *      pass initial values as overrides and mutate it for per-test changes.
 */
import { type Mock } from 'vitest';
import { useGraphiQL, useGraphiQLActions, useMonaco } from '@graphiql/react';

export interface GraphiQLReactMockState {
  schema: unknown;
  queryText: string;
  variablesText: string | undefined;
  operationName: string | undefined;
  // Tests that exercise editor-cursor behavior set a stub editor here; left null
  // otherwise so the builder falls back to updateActiveTabValues.
  queryEditor: unknown;
  updateActiveTabValues(values: { query?: string; variables?: string }): void;
}

/**
 * Build a fresh state object and wire the vi.fn() mocks to read it live. Returns
 * the state so the test can mutate it; call once per test (e.g. in beforeEach).
 */
export function installGraphiQLReactMock(
  overrides: Partial<GraphiQLReactMockState> = {},
): GraphiQLReactMockState {
  const state: GraphiQLReactMockState = {
    schema: null,
    queryText: '{ __typename }',
    variablesText: undefined,
    operationName: undefined,
    queryEditor: null,
    updateActiveTabValues() {},
    ...overrides,
  };

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
        schema: state.schema,
        queryEditor: state.queryEditor,
        variableEditor: null,
        activeTabIndex: 0,
        tabs: [{ query: state.queryText, variables: state.variablesText }],
        operationName: state.operationName,
      }),
  );

  (useGraphiQLActions as Mock).mockImplementation(() => ({
    updateActiveTabValues: (v: { query?: string; variables?: string }) =>
      state.updateActiveTabValues(v),
  }));

  const monacoStub = {
    monaco: {
      editor: {
        CursorChangeReason: { Explicit: 3 },
      },
    },
  };
  (useMonaco as Mock).mockImplementation(
    (selector: (state: typeof monacoStub) => unknown) => selector(monacoStub),
  );

  return state;
}
