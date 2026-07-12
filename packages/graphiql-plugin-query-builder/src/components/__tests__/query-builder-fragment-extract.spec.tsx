/**
 * Integration test for the contextual fragment-extraction row action. Renders
 * QueryBuilder against a schema, expands a composite field, and drives the
 * row's "Extract to fragment" action, asserting the editor receives the
 * correctly-mutated query — no editor cursor involved.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
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

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    name: { type: GraphQLString },
    email: { type: GraphQLString },
  },
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: { type: UserType },
    admin: { type: UserType },
  },
});

const TestSchema = new GraphQLSchema({ query: QueryType });

describe('QueryBuilder — fragment extraction row action', () => {
  let writtenQueries: string[];
  let state: GraphiQLReactMockState;

  beforeEach(() => {
    writtenQueries = [];
    state = installGraphiQLReactMock({
      schema: TestSchema,
      queryText: '{ user { name email } }',
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

  it('extracts the selection into a fragment and replaces it with a spread', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder />);

    // Expand `user` so its non-empty selection becomes extractable.
    await user.click(screen.getByRole('button', { name: /expand user/i }));

    const extract = await screen.findByRole('button', {
      name: /extract user to a fragment/i,
    });
    await user.click(extract);

    await waitFor(() => {
      const q = lastQuery();
      expect(q).toMatch(/user\s*{\s*\.\.\.UserFields\s*}/);
      expect(q).toMatch(/fragment UserFields on User/);
      expect(q).toMatch(/name/);
      expect(q).toMatch(/email/);
    });
  });

  it('does not offer extraction on a composite row with no selection', async () => {
    const user = userEvent.setup();
    state.queryText = '{ user { name } }';
    render(<QueryBuilder />);

    // `admin` is present in the schema but not selected; expanding it shows an
    // empty selection, so there is nothing to extract.
    await user.click(screen.getByRole('button', { name: /expand admin/i }));

    expect(
      screen.queryByRole('button', { name: /extract admin to a fragment/i }),
    ).not.toBeInTheDocument();
  });
});
