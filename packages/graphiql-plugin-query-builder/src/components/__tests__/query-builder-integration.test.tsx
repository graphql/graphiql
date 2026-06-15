/**
 * Integration test: QueryBuilder renders with a schema, the user interacts with
 * list-of-Int and input-object args, and the editor receives a correctly-typed
 * query string. This is the test that would have caught the original bug where
 * list/input-object changes were discarded because handleSetArg early-returned.
 *
 * The mock in src/__mocks__/@graphiql/react.ts (aliased via vitest.config.mts)
 * exposes `__state` so tests can control schema + query text.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLInputObjectType,
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
// Test schema: items(ids: [Int], filter: FilterInput)
// ---------------------------------------------------------------------------

const FilterInput = new GraphQLInputObjectType({
  name: 'FilterInput',
  fields: {
    name: { type: GraphQLString },
    limit: { type: GraphQLInt },
  },
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    items: {
      type: new GraphQLList(GraphQLString),
      args: {
        ids: { type: new GraphQLList(GraphQLInt) },
        filter: { type: FilterInput },
      },
    },
  },
});

const TestSchema = new GraphQLSchema({ query: QueryType });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QueryBuilder integration — list and input-object args', () => {
  let writtenQueries: string[];

  beforeEach(() => {
    writtenQueries = [];
    __state.schema = TestSchema;
    // items is in the doc so args are visible (isFieldSelected → true)
    __state.queryText = '{ items }';
    __state.updateActiveTabValues = (vals: { query?: string }) => {
      if (vals.query !== undefined) {
        writtenQueries.push(vals.query);
        // Feed back so the next re-render picks up the new doc
        __state.queryText = vals.query;
      }
    };
  });

  function lastQuery(): string {
    return writtenQueries[writtenQueries.length - 1] ?? __state.queryText;
  }

  it('renders the items field', () => {
    render(<QueryBuilder />);
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  it('shows arg inputs for a selected field (items is in doc)', () => {
    render(<QueryBuilder />);
    // ids is a list arg → should show an "Add item" button
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    // filter is an input object → should show a disclosure
    const details = document.querySelector('details.graphiql-qb-input-object');
    expect(details).toBeInTheDocument();
  });

  /**
   * THE KEY BUG REGRESSION TEST: before the fix, list/input-object arg changes
   * were discarded. After the fix they reach the document with correct types.
   *
   * Start with `ids: [1]` already in the doc so the spinbutton is pre-rendered.
   * Then change the value — the result must be an IntValue, not a StringValue.
   */
  it('list-of-Int arg: editing an item produces IntValue (not StringValue)', async () => {
    const user = userEvent.setup();
    // Pre-populate the doc with one ids item so the spinbutton renders immediately
    __state.queryText = '{ items(ids: [1]) }';
    render(<QueryBuilder />);

    // The list of Int should have rendered one spinbutton labeled 'ids'
    const intInputs = screen.getAllByRole('spinbutton');
    const idsInput = intInputs.find(el => el.getAttribute('aria-label') === 'ids');
    expect(idsInput).toBeTruthy();

    // Type a value
    await user.type(idsInput!, '7');

    // The query written after typing must contain an IntValue (bare digits, not quoted)
    const q = lastQuery();
    expect(q).toContain('ids:');
    // ids: [<digits>] — bare integer (not quoted like ids: ["17"])
    expect(q).toMatch(/ids: \[\d+\]/);
    expect(q).not.toMatch(/ids: \["\d+"/);
  });

  it('input-object arg Int field: single digit produces IntValue, not StringValue', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder />);

    // The filter disclosure (details/summary) is already visible since filter
    // is rendered as a collapsed InputObjectArgInput.
    const limitInput = screen.getByRole('spinbutton', { name: 'limit' });
    await user.type(limitInput, '5');

    const q = lastQuery();
    // limit is an Int field — must appear unquoted in the output
    expect(q).toContain('filter:');
    expect(q).toMatch(/limit: 5/);
    expect(q).not.toMatch(/limit: "5"/);
  });

  it('input-object arg String field: typing produces a quoted StringValue', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder />);

    const nameInput = screen.getByRole('textbox', { name: 'name' });
    await user.type(nameInput, 'x');

    const q = lastQuery();
    // name is a String — must appear quoted
    expect(q).toContain('filter:');
    expect(q).toMatch(/name: "x"/);
  });
});
