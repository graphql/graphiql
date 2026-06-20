/**
 * The cursor reveal (flash/scroll/expand) must follow only genuine user cursor
 * navigation, not the builder's own writes.
 *
 * Every builder edit rewrites the editor via setValue + setPosition, which fire
 * `onDidChangeCursorPosition` with reasons ContentFlush (1) and NotSet (0).
 * Only a real mouse/keyboard move produces reason Explicit (3), so the reveal
 * is gated on that reason — ContentFlush/NotSet are ignored to avoid flashing
 * an unrelated field whenever the builder writes to the editor.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { installGraphiQLReactMock } from './graphiql-react-mock';
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
  const query = '{ id }';
  let cursorCb: ((e: { reason: number }) => void) | undefined;
  installGraphiQLReactMock({
    schema: TestSchema,
    queryText: query,
    queryEditor: {
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
    },
  });
  return { fireCursor: (reason: number) => act(() => cursorCb?.({ reason })) };
}

const idRow = () =>
  screen
    .getAllByTestId('field-row')
    .find(
      r => r.querySelector('.graphiql-qb-field-name')?.textContent === 'id',
    )!;

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('cursor reveal trigger', () => {
  it('reveals on user navigation but not on programmatic cursor changes', async () => {
    const { fireCursor } = setupEditor();
    render(<QueryBuilder />);

    // Mount-time reveal flashes the field; wait for it to clear before testing
    // programmatic vs. user cursor events.
    await waitFor(() => expect(idRow()).toHaveClass('graphiql-qb-flash'));
    await waitFor(() => expect(idRow()).not.toHaveClass('graphiql-qb-flash'), {
      timeout: 1500,
    });

    fireCursor(1); // ContentFlush — builder's own write, must be ignored
    fireCursor(0); // NotSet — also from builder writes
    await delay(200); // past the 80ms recompute debounce
    expect(idRow()).not.toHaveClass('graphiql-qb-flash');

    fireCursor(3); // Explicit — genuine user navigation
    await waitFor(() => expect(idRow()).toHaveClass('graphiql-qb-flash'));
  });
});
