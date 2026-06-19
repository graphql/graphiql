/**
 * Regression test: the cursor reveal (flash/scroll/expand) must follow only
 * genuine user cursor navigation, not the builder's own writes.
 *
 * Every builder edit rewrites the editor via setValue + setPosition, which fire
 * `onDidChangeCursorPosition` with reasons ContentFlush (1) and NotSet (0).
 * Those used to re-reveal whatever field the cursor sat on, so editing one field
 * flashed/scrolled an unrelated one. The fix filters to Explicit (3) — the
 * reason for a real mouse/keyboard cursor move.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { __state, installGraphiQLReactMock } from './graphiql-react-mock';
import { QueryBuilder } from '../query-builder';

vi.mock('@graphiql/react', async () => {
  const actual =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return { ...actual, useGraphiQL: vi.fn(), useGraphiQLActions: vi.fn() };
});

const TestSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: { id: { type: GraphQLID }, name: { type: GraphQLString } },
  }),
});

// A stub editor whose cursor always resolves to the `id` field, exposing the
// cursor-change callback so the test can fire events with specific reasons.
function setupEditor() {
  installGraphiQLReactMock();
  const query = '{ id }';
  let cursorCb: ((e: { reason: number }) => void) | undefined;
  __state.schema = TestSchema;
  __state.queryText = query;
  __state.queryEditor = {
    onDidChangeCursorPosition(cb: (e: { reason: number }) => void) {
      cursorCb = cb;
      return { dispose() {} };
    },
    getModel: () => ({
      getValue: () => query,
      getOffsetAt: () => query.indexOf('id') + 1, // inside the `id` token
    }),
    getPosition: () => ({ lineNumber: 1, column: 4 }),
    getValue: () => query,
    setValue() {},
    setPosition() {},
  };
  return { fireCursor: (reason: number) => act(() => cursorCb?.({ reason })) };
}

const idRow = () =>
  screen
    .getAllByTestId('field-row')
    .find(
      r => r.querySelector('.graphiql-qb-field-name')?.textContent === 'id',
    )!;

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

afterEach(() => {
  __state.queryEditor = null;
});

describe('cursor reveal trigger', () => {
  it('reveals on user navigation but not on programmatic cursor changes', async () => {
    const { fireCursor } = setupEditor();
    render(<QueryBuilder />);

    // The mount-time reveal flashes the cursor's field; wait for it to clear so
    // we start from a known state with no active flash.
    await waitFor(() => expect(idRow()).toHaveClass('graphiql-qb-flash'));
    await waitFor(() => expect(idRow()).not.toHaveClass('graphiql-qb-flash'), {
      timeout: 1500,
    });

    // Programmatic cursor changes from our own setValue/setPosition: ignored.
    fireCursor(1); // ContentFlush
    fireCursor(0); // NotSet
    await delay(200); // past the 80ms recompute debounce
    expect(idRow()).not.toHaveClass('graphiql-qb-flash');

    // A genuine user cursor move: revealed.
    fireCursor(3); // Explicit
    await waitFor(() => expect(idRow()).toHaveClass('graphiql-qb-flash'));
  });
});
