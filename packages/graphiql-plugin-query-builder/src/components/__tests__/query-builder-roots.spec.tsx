/**
 * The root operation sections (Query / Mutation / Subscription) follow the
 * active operation: the root matching the active operation's kind is expanded
 * and enabled, the others are collapsed and disabled. The active operation is
 * driven by `operationName` from the editor store (mocked via graphiql-react-mock).
 */
import { render, screen } from '@testing-library/react';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type GraphiQLReactMockState,
  installGraphiQLReactMock,
} from './graphiql-react-mock';
import { QueryBuilder } from '../query-builder';

vi.mock('@graphiql/react', async () => {
  const actual =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return { ...actual, useGraphiQL: vi.fn(), useGraphiQLActions: vi.fn() };
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: { items: { type: GraphQLString } },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: { createItem: { type: GraphQLString } },
});

const TestSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

describe('QueryBuilder — root operation sections', () => {
  let state: GraphiQLReactMockState;

  beforeEach(() => {
    state = installGraphiQLReactMock({
      schema: TestSchema,
      queryText: '{ items }',
    });
  });

  it('expands and enables the root matching the active query operation', () => {
    render(<QueryBuilder />);

    expect(screen.getByRole('button', { name: /Query/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Mutation/i })).toBeDisabled();

    // Query root is expanded -> its fields render; Mutation is collapsed.
    expect(screen.getByText('items')).toBeInTheDocument();
    expect(screen.queryByText('createItem')).toBeNull();
  });

  it('switches the active root when the active operation is a mutation', () => {
    state.queryText = 'mutation M { createItem }';
    state.operationName = 'M';
    render(<QueryBuilder />);

    expect(screen.getByRole('button', { name: /Mutation/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Query/i })).toBeDisabled();

    expect(screen.getByText('createItem')).toBeInTheDocument();
    expect(screen.queryByText('items')).toBeNull();
  });

  it('shows the selected-field count only on the active root', () => {
    render(<QueryBuilder />);

    expect(screen.getByRole('button', { name: /Query/i })).toHaveTextContent(
      /selected/i,
    );
    expect(
      screen.getByRole('button', { name: /Mutation/i }),
    ).not.toHaveTextContent(/selected/i);
  });
});
