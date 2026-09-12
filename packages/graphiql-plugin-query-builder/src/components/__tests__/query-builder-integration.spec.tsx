/**
 * Integration test: QueryBuilder renders with a schema, the user interacts with
 * list-of-Int and input-object args, and the editor receives a correctly-typed
 * query string. Exercises list and input-object arg edits end to end: handleSetArg
 * must apply them to the document rather than discard them.
 *
 * The shared graphiql-react-mock helper exposes a per-test state object so tests
 * can control schema + query text and observe the builder's writes.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  type GraphiQLReactMockState,
  installGraphiQLReactMock,
} from './graphiql-react-mock';
import { QueryBuilder } from '../query-builder';

vi.mock('@graphiql/react', async () => {
  const actual =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return {
    ...actual,
    useGraphiQL: vi.fn(),
    useGraphiQLActions: vi.fn(),
    useMonaco: vi.fn(),
  };
});

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

describe('QueryBuilder integration — list and input-object args', () => {
  let writtenQueries: string[];
  let state: GraphiQLReactMockState;

  beforeEach(() => {
    writtenQueries = [];
    // items must be in the doc so its args are visible (isFieldSelected → true)
    state = installGraphiQLReactMock({
      schema: TestSchema,
      queryText: '{ items }',
      updateActiveTabValues(values: { query?: string }) {
        if (values.query !== undefined) {
          writtenQueries.push(values.query);
          state.queryText = values.query;
        }
      },
    });
  });

  function lastQuery(): string {
    return writtenQueries.at(-1) ?? state.queryText;
  }

  it('renders the items field', () => {
    render(<QueryBuilder />);
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  it('shows arg inputs for a selected field (items is in doc)', () => {
    render(<QueryBuilder />);
    expect(
      screen.getByRole('button', { name: /add item/i }),
    ).toBeInTheDocument();
    const details = document.querySelector('details.graphiql-qb-input-object');
    expect(details).toBeInTheDocument();
  });

  it('list-of-Int arg: editing an item produces IntValue (not StringValue)', async () => {
    const user = userEvent.setup();
    // Pre-populate with one ids item so the spinbutton renders immediately.
    state.queryText = '{ items(ids: [1]) }';
    render(<QueryBuilder />);

    const intInputs = screen.getAllByRole('spinbutton');
    const idsInput = intInputs.find(
      el => el.getAttribute('aria-label') === 'ids',
    );
    expect(idsInput).toBeTruthy();

    await user.type(idsInput!, '7');

    // Must be an IntValue (bare digits, not quoted). Editor write is debounced.
    await waitFor(() => {
      const q = lastQuery();
      expect(q).toContain('ids:');
      expect(q).toMatch(/ids: \[\d+\]/);
      expect(q).not.toMatch(/ids: \["\d+"/);
    });
  });

  it('input-object arg Int field: single digit produces IntValue, not StringValue', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder />);

    // Input-object fields render lazily; expand the filter disclosure first.
    // findByRole (not getByRole) so we wait for the lazy fields to render.
    await user.click(screen.getByText('filter'));
    const limitInput = await screen.findByRole('spinbutton', { name: 'limit' });
    await user.type(limitInput, '5');

    await waitFor(() => {
      const q = lastQuery();
      expect(q).toContain('filter:');
      expect(q).toMatch(/limit: 5/);
      expect(q).not.toMatch(/limit: "5"/);
    });
  });

  it('input-object arg String field: typing produces a quoted StringValue', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder />);

    // Input-object fields render lazily; expand the filter disclosure first.
    // findByRole (not getByRole) so we wait for the lazy fields to render.
    await user.click(screen.getByText('filter'));
    const nameInput = await screen.findByRole('textbox', { name: 'name' });
    await user.type(nameInput, 'x');

    await waitFor(() => {
      const q = lastQuery();
      expect(q).toContain('filter:');
      expect(q).toMatch(/name: "x"/);
    });
  });
});
