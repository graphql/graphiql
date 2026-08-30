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

  it('keeps the extracted field editable and shows the spread as a child reference', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder />);

    await user.click(screen.getByRole('button', { name: /expand user/i }));
    await user.click(
      await screen.findByRole('button', {
        name: /extract user to a fragment/i,
      }),
    );

    // The row is not frozen into a badge: the spread shows as a child
    // reference and the field's own children can still be toggled.
    await waitFor(() =>
      expect(screen.getByTestId('fragment-ref')).toHaveTextContent(
        'UserFields',
      ),
    );

    // Ticking another field adds it to the base query alongside the spread,
    // not to the fragment.
    await user.click(screen.getByRole('checkbox', { name: /toggle email/i }));

    await waitFor(() => {
      const q = lastQuery();
      expect(q).toMatch(/user\s*{\s*\.\.\.UserFields\s+email\s*}/);
      // The fragment definition is untouched by the base-query edit.
      expect(q.match(/fragment UserFields/g)).toHaveLength(1);
    });
  });

  it('removes the spread when its reference row is unchecked', async () => {
    const user = userEvent.setup();
    state.queryText = `
      { user { ...UserFields email } }
      fragment UserFields on User { name }
    `;
    render(<QueryBuilder />);

    await user.click(screen.getByRole('button', { name: /expand user/i }));

    // The spread reference is a checked box; unchecking it removes the spread.
    const spreadBox = await screen.findByRole('checkbox', {
      name: /remove fragment spread UserFields/i,
    });
    expect(spreadBox).toBeChecked();
    await user.click(spreadBox);

    await waitFor(() => {
      const q = lastQuery();
      // Spread gone, sibling field kept, fragment definition still present.
      expect(q).not.toMatch(/\.\.\.UserFields/);
      expect(q).toMatch(/user\s*{\s*email\s*}/);
      expect(q).toMatch(/fragment UserFields on User/);
    });
    // The reference row disappears with the spread.
    expect(screen.queryByTestId('fragment-ref')).not.toBeInTheDocument();
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

  it('edits a fragment from the fragments list without touching the base query', async () => {
    const user = userEvent.setup();
    state.queryText = `
      { user { ...UserFields } }
      fragment UserFields on User { name }
    `;
    render(<QueryBuilder />);

    // Click the fragment in the list to focus it for editing.
    await user.click(
      screen.getByRole('button', { name: /edit fragment UserFields/i }),
    );

    // The focused fragment editor is rooted at the fragment's type: ticking a
    // field edits the fragment, not the operation.
    await user.click(screen.getByRole('checkbox', { name: /toggle email/i }));

    await waitFor(() => {
      const q = lastQuery();
      expect(q).toMatch(/fragment UserFields on User\s*{\s*name\s+email\s*}/);
      // The operation still just spreads the fragment — unchanged.
      expect(q).toMatch(/user\s*{\s*\.\.\.UserFields\s*}/);
    });

    // Back to query returns to the operation view.
    await user.click(screen.getByRole('button', { name: /back to query/i }));
    expect(
      screen.queryByRole('button', { name: /back to query/i }),
    ).not.toBeInTheDocument();
  });

  it('deletes a fragment from the list, inlining it where spread', async () => {
    const user = userEvent.setup();
    state.queryText = `
      { user { ...UserFields } }
      fragment UserFields on User { name email }
    `;
    render(<QueryBuilder />);

    await user.click(
      screen.getByRole('button', { name: /delete fragment UserFields/i }),
    );

    await waitFor(() => {
      const q = lastQuery();
      // Spread and definition are gone; the selections are inlined in place.
      expect(q).not.toMatch(/\.\.\.UserFields/);
      expect(q).not.toMatch(/fragment UserFields/);
      expect(q).toMatch(/user\s*{\s*name\s+email\s*}/);
    });
    expect(
      screen.queryByRole('button', { name: /edit fragment UserFields/i }),
    ).not.toBeInTheDocument();
  });

  it('returns to the operation view when the fragment being edited is deleted', async () => {
    const user = userEvent.setup();
    state.queryText = `
      { user { ...UserFields } }
      fragment UserFields on User { name }
    `;
    render(<QueryBuilder />);

    await user.click(
      screen.getByRole('button', { name: /edit fragment UserFields/i }),
    );
    expect(
      screen.getByRole('button', { name: /back to query/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /delete fragment UserFields/i }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /back to query/i }),
      ).not.toBeInTheDocument(),
    );
  });
});
