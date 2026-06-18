/**
 * Behavioral guarantees of the working-document model:
 *
 *  1. Multi-char typing: typing "hello" into a scalar arg yields "hello", not
 *     just the last character. The builder mutates its working document
 *     synchronously, so each keystroke accumulates. (`waitFor` wraps the
 *     written-query assertions only to ride out React's async re-renders.)
 *
 *  2. Add list item persists: clicking "Add item" on a list arg renders a
 *     visible input that stays on screen even though an empty element can't be
 *     represented in the document.
 *
 * Both tests use the stateful __state mock so the query write feeds back into
 * the component (the same pattern as query-builder-integration.test.tsx).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { describe, expect, it, beforeEach } from 'vitest';
import { __state } from '../../__mocks__/@graphiql/react';
import { QueryBuilder } from '../query-builder';

// ---------------------------------------------------------------------------
// Test schema: search(query: String), items(ids: [Int])
// ---------------------------------------------------------------------------

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    search: {
      type: GraphQLString,
      args: {
        query: { type: GraphQLString },
      },
    },
    items: {
      type: new GraphQLList(GraphQLString),
      args: {
        ids: { type: new GraphQLList(GraphQLInt) },
      },
    },
  },
});

const TestSchema = new GraphQLSchema({ query: QueryType });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupState(queryText: string) {
  const writtenQueries: string[] = [];
  __state.schema = TestSchema;
  __state.queryText = queryText;
  __state.updateActiveTabValues = (values: { query?: string }) => {
    if (values.query !== undefined) {
      writtenQueries.push(values.query);
      __state.queryText = values.query;
    }
  };
  return { writtenQueries };
}

// ---------------------------------------------------------------------------
// Bug 1: multi-char input
// ---------------------------------------------------------------------------

describe('multi-char scalar input — local state fix', () => {
  beforeEach(() => {
    setupState('{ search }');
  });

  it('typing a multi-char string produces the full value in the document', async () => {
    const { writtenQueries } = setupState('{ search }');
    const user = userEvent.setup();
    render(<QueryBuilder />);

    const input = screen.getByRole('textbox', { name: 'query' });
    await user.type(input, 'hello');

    // The last written query must contain the full string "hello", not just "o"
    await waitFor(() =>
      expect(writtenQueries.at(-1) ?? '').toMatch(/query: "hello"/),
    );
  });

  it('pasting a multi-char string (single change event) produces the full value', async () => {
    const { writtenQueries } = setupState('{ search }');
    const user = userEvent.setup();
    render(<QueryBuilder />);

    const input = screen.getByRole('textbox', { name: 'query' });
    // Simulate a paste by clearing and typing all at once via clipboard API
    await user.click(input);
    await user.paste('world');

    await waitFor(() =>
      expect(writtenQueries.at(-1) ?? '').toMatch(/query: "world"/),
    );
  });

  it('external document change is reflected in the input', () => {
    // Start with search(query: "old") in the doc
    const { writtenQueries } = setupState('{ search(query: "old") }');
    const { rerender } = render(<QueryBuilder />);

    const input = screen.getByRole('textbox', { name: 'query' });
    expect(input).toHaveValue('old');

    // Simulate an external change (e.g. user edits the editor directly):
    // update __state.queryText and re-render
    __state.queryText = '{ search(query: "new") }';
    rerender(<QueryBuilder />);

    // The input should now show "new" (external change synced in)
    expect(screen.getByRole('textbox', { name: 'query' })).toHaveValue('new');

    // writtenQueries should be empty — we didn't type, just sync'd externally
    expect(writtenQueries).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Bug 2: add list item persists
// ---------------------------------------------------------------------------

describe('list arg add-item persists — local state fix', () => {
  it('clicking Add item renders a new input that stays visible', async () => {
    const { writtenQueries } = setupState('{ items }');
    const user = userEvent.setup();
    render(<QueryBuilder />);

    // Before clicking, no spinbutton for "ids" exists
    expect(screen.queryByRole('spinbutton', { name: 'ids' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /add item/i }));

    // After clicking, a new input must be visible — it must NOT vanish
    const newInput = screen.getByRole('spinbutton', { name: 'ids' });
    expect(newInput).toBeInTheDocument();

    // writtenQueries at this point may be empty (empty item omitted from doc) or
    // contain the intermediate write — either way the UI input must exist.
    // Now type a value into it
    await user.type(newInput, '5');

    // The document must ultimately contain ids: [5]
    await waitFor(() =>
      expect(writtenQueries.at(-1) ?? '').toMatch(/ids: \[5\]/),
    );
  });

  it('can add a second list item after typing the first', async () => {
    const { writtenQueries } = setupState('{ items(ids: [3]) }');
    const user = userEvent.setup();
    render(<QueryBuilder />);

    // One spinbutton pre-exists for the existing ids: [3] item
    expect(screen.getAllByRole('spinbutton', { name: 'ids' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /add item/i }));

    // Two spinbuttons now (existing + new empty)
    const inputs = screen.getAllByRole('spinbutton', { name: 'ids' });
    expect(inputs).toHaveLength(2);

    // Type a value into the second (new) input
    await user.type(inputs[1]!, '7');

    // Should contain both ids values
    await waitFor(() =>
      expect(writtenQueries.at(-1) ?? '').toMatch(/ids: \[\d+,\s*7\]/),
    );
  });
});
