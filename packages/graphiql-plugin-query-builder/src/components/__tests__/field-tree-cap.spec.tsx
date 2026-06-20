import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installGraphiQLReactMock } from './graphiql-react-mock';
import { QueryBuilder } from '../query-builder';

vi.mock('@graphiql/react', async () => {
  const actual =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return { ...actual, useGraphiQL: vi.fn(), useGraphiQLActions: vi.fn() };
});

// Query type with 25 fields: f0..f24.
const WideQuery = new GraphQLObjectType({
  name: 'Query',
  fields: Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [`f${i}`, { type: GraphQLString }]),
  ),
});
const TestSchema = new GraphQLSchema({ query: WideQuery });

function fieldNames(): string[] {
  return screen
    .getAllByTestId('field-row')
    .map(r => r.querySelector('.graphiql-qb-field-name')?.textContent ?? '');
}

describe('FieldTreeList — cap', () => {
  beforeEach(() => {
    installGraphiQLReactMock({ schema: TestSchema, queryText: '{ __typename }' });
  });

  it('caps the list at 20 fields and shows a "N more" control', () => {
    render(<QueryBuilder />);
    const names = fieldNames();
    expect(names).toContain('f0');
    expect(names).toContain('f19');
    expect(names).not.toContain('f20');
    expect(screen.getByRole('button', { name: /5 more/i })).toBeInTheDocument();
  });

  it('reveals the rest when "N more" is clicked', async () => {
    render(<QueryBuilder />);
    await userEvent.click(screen.getByRole('button', { name: /5 more/i }));
    expect(fieldNames()).toContain('f24');
    expect(screen.queryByRole('button', { name: /more/i })).toBeNull();
  });

  it('keeps a selected field visible even when it sorts beyond the cap', () => {
    installGraphiQLReactMock({ schema: TestSchema, queryText: '{ f24 }' });
    render(<QueryBuilder />);
    expect(fieldNames()).toContain('f24');
  });
});
