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
 * Both tests use the stateful graphiql-react-mock so the query write feeds back
 * into the component (the same pattern as query-builder-integration.spec.tsx).
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
import { describe, expect, it, vi } from 'vitest';
import { installGraphiQLReactMock } from './graphiql-react-mock';
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

function setupState(queryText: string) {
  const writtenQueries: string[] = [];
  const state = installGraphiQLReactMock({
    schema: TestSchema,
    queryText,
    updateActiveTabValues(values: { query?: string }) {
      if (values.query !== undefined) {
        writtenQueries.push(values.query);
        state.queryText = values.query;
      }
    },
  });
  return { writtenQueries, state };
}

describe('multi-char scalar input — local state fix', () => {
  it('typing a multi-char string produces the full value in the document', async () => {
    const { writtenQueries } = setupState('{ search }');
    const user = userEvent.setup();
    render(<QueryBuilder />);

    const input = screen.getByRole('textbox', { name: 'query' });
    await user.type(input, 'hello');

    await waitFor(() =>
      expect(writtenQueries.at(-1) ?? '').toMatch(/query: "hello"/),
    );
  });

  it('pasting a multi-char string (single change event) produces the full value', async () => {
    const { writtenQueries } = setupState('{ search }');
    const user = userEvent.setup();
    render(<QueryBuilder />);

    const input = screen.getByRole('textbox', { name: 'query' });
    await user.click(input);
    await user.paste('world');

    await waitFor(() =>
      expect(writtenQueries.at(-1) ?? '').toMatch(/query: "world"/),
    );
  });

  it('external document change is reflected in the input', () => {
    const { writtenQueries, state } = setupState('{ search(query: "old") }');
    const { rerender } = render(<QueryBuilder />);

    const input = screen.getByRole('textbox', { name: 'query' });
    expect(input).toHaveValue('old');

    // Simulate an external change (user edits the editor directly).
    state.queryText = '{ search(query: "new") }';
    rerender(<QueryBuilder />);

    expect(screen.getByRole('textbox', { name: 'query' })).toHaveValue('new');

    // writtenQueries must be empty — no user edit occurred, only an external sync
    expect(writtenQueries).toHaveLength(0);
  });
});

describe('list arg add-item persists — local state fix', () => {
  it('clicking Add item renders a new input that stays visible', async () => {
    const { writtenQueries } = setupState('{ items }');
    const user = userEvent.setup();
    render(<QueryBuilder />);

    expect(screen.queryByRole('spinbutton', { name: 'ids' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /add item/i }));

    const newInput = screen.getByRole('spinbutton', { name: 'ids' });
    expect(newInput).toBeInTheDocument();

    // writtenQueries may be empty here (empty item omitted from doc) — the UI
    // input must persist regardless.
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

    expect(screen.getAllByRole('spinbutton', { name: 'ids' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /add item/i }));

    const inputs = screen.getAllByRole('spinbutton', { name: 'ids' });
    expect(inputs).toHaveLength(2);

    await user.type(inputs[1]!, '7');

    await waitFor(() =>
      expect(writtenQueries.at(-1) ?? '').toMatch(/ids: \[\d+,\s*7\]/),
    );
  });
});
