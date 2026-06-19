/**
 * Promoting a scalar argument to a variable must work on the ACTIVE operation's
 * root type — including mutation fields, which aren't on the query type. The
 * promoted value lands in the variables JSON (not a signature default), and the
 * operation gets a bare `$name: Type` variable definition.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installGraphiQLReactMock } from './graphiql-react-mock';
import { QueryBuilder } from '../query-builder';

vi.mock('@graphiql/react', async () => {
  const actual =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return { ...actual, useGraphiQL: vi.fn(), useGraphiQLActions: vi.fn() };
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: { ping: { type: GraphQLString } },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    setString: {
      type: GraphQLString,
      args: { value: { type: GraphQLString } },
    },
  },
});

const TestSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

describe('QueryBuilder — promoting a mutation argument to a variable', () => {
  let writes: { query?: string; variables?: string }[];

  beforeEach(() => {
    writes = [];
    installGraphiQLReactMock({
      schema: TestSchema,
      queryText: 'mutation B {\n  setString(value: "hi")\n}',
      operationName: 'B',
      updateActiveTabValues: values => {
        writes.push(values);
      },
    });
  });

  it('writes the value to the variables JSON and a bare variable definition', async () => {
    render(<QueryBuilder />);

    await userEvent.click(
      screen.getByRole('button', { name: /use as variable/i }),
    );

    const queryWrite = writes.findLast(w => w.query !== undefined)?.query;
    const variablesWrite = writes.findLast(
      w => w.variables !== undefined,
    )?.variables;

    // Operation references the variable with NO default in the signature.
    expect(queryWrite).toContain('$value: String');
    expect(queryWrite).not.toContain('= "hi"');
    expect(queryWrite).toContain('value: $value');

    // The value moved into the variables JSON.
    expect(JSON.parse(variablesWrite!)).toEqual({ value: 'hi' });
  });
});
