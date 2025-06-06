import { Mock } from 'vitest';
import { useGraphiQL as $useGraphiQL } from '@graphiql/react';
import { render } from '@testing-library/react';
import { GraphQLInt, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { FC, useEffect } from 'react';
import {
  DocExplorerStore,
  useDocExplorer,
  useDocExplorerActions,
} from '../../context';
import { DocExplorer } from '../doc-explorer';

const useGraphiQL = $useGraphiQL as Mock;

vi.mock('@graphiql/react', async () => {
  const originalModule =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return {
    ...originalModule,
    useGraphiQL: vi.fn(),
  };
});

function makeSchema(fieldName = 'field') {
  return new GraphQLSchema({
    description: 'GraphQL Schema for testing',
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        [fieldName]: {
          type: GraphQLInt,
          args: {
            arg: {
              type: GraphQLInt,
            },
          },
        },
      },
    }),
  });
}

const defaultSchemaContext = {
  fetchError: null,
  introspect() {},
  isFetching: false,
  schema: makeSchema(),
  validationErrors: [],
};

const withErrorSchemaContext = {
  ...defaultSchemaContext,
  fetchError: 'Error fetching schema',
  schema: new GraphQLSchema({ description: 'GraphQL Schema for testing' }),
};

const DocExplorerWithContext: FC = () => {
  return (
    <DocExplorerStore>
      <DocExplorer />
    </DocExplorerStore>
  );
};

describe('DocExplorer', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders spinner when the schema is loading', async () => {
    useGraphiQL.mockImplementation(cb =>
      cb({ ...defaultSchemaContext, isFetching: true }),
    );
    const { container } = render(<DocExplorerWithContext />);
    const spinner = container.querySelectorAll('.graphiql-spinner');
    expect(spinner).toHaveLength(1);
  });
  it('renders with null schema', () => {
    useGraphiQL.mockImplementation(cb =>
      cb({ ...defaultSchemaContext, schema: null }),
    );
    const { container } = render(<DocExplorerWithContext />);
    const error = container.querySelectorAll('.graphiql-doc-explorer-error');
    expect(error).toHaveLength(1);
    expect(error[0]).toHaveTextContent('No GraphQL schema available');
  });
  it('renders with schema', () => {
    useGraphiQL.mockImplementation(cb => cb(defaultSchemaContext));
    const { container } = render(<DocExplorerWithContext />);
    const error = container.querySelectorAll('.graphiql-doc-explorer-error');
    expect(error).toHaveLength(0);
    expect(
      container.querySelector('.graphiql-markdown-description'),
    ).toHaveTextContent('GraphQL Schema for testing');
  });
  it('renders correctly with schema error', () => {
    useGraphiQL.mockImplementation(cb => cb(withErrorSchemaContext));
    const { rerender, container } = render(<DocExplorerWithContext />);
    const error = container.querySelector('.graphiql-doc-explorer-error');
    expect(error).toHaveTextContent('Error fetching schema');
    useGraphiQL.mockImplementation(cb => cb(defaultSchemaContext));
    rerender(<DocExplorerWithContext />);
    const errors = container.querySelectorAll('.graphiql-doc-explorer-error');
    expect(errors).toHaveLength(0);
  });
  it('maintains nav stack when possible', () => {
    const initialSchema = makeSchema();
    const Query = initialSchema.getType('Query');
    const { field } = (Query as GraphQLObjectType).getFields();

    // A hacky component to set the initial explorer nav stack
    const SetInitialStack: React.FC = () => {
      const explorerNavStack = useDocExplorer();
      const { push } = useDocExplorerActions();
      useEffect(() => {
        if (explorerNavStack.length === 1) {
          push({ name: 'Query', def: Query });
          push({ name: 'field', def: field });
        }
      }, [explorerNavStack.length, push]);
      return null;
    };

    // Initial render, set initial state
    useGraphiQL.mockImplementation(cb =>
      cb({ ...defaultSchemaContext, schema: initialSchema }),
    );
    const { container, rerender } = render(
      <DocExplorerStore>
        <SetInitialStack />
      </DocExplorerStore>,
    );

    // First proper render of doc explorer
    rerender(
      <DocExplorerStore>
        <DocExplorer />
      </DocExplorerStore>,
    );

    const title = container.querySelector('.graphiql-doc-explorer-title')!;
    expect(title.textContent).toEqual('field');

    // Second render of doc explorer, this time with a new schema, with _same_ field name
    useGraphiQL.mockImplementation(cb =>
      cb({
        ...defaultSchemaContext,
        schema: makeSchema(), // <<< New, but equivalent, schema
      }),
    );
    rerender(
      <DocExplorerStore>
        <DocExplorer />
      </DocExplorerStore>,
    );
    const title2 = container.querySelector('.graphiql-doc-explorer-title')!;
    // Because `Query.field` still exists in the new schema, we can still render it
    expect(title2.textContent).toEqual('field');
  });
  it('trims nav stack when necessary', () => {
    const initialSchema = makeSchema();
    const Query = initialSchema.getType('Query');
    const { field } = (Query as GraphQLObjectType).getFields();

    // A hacky component to set the initial explorer nav stack
    // eslint-disable-next-line sonarjs/no-identical-functions -- todo: could be refactored
    const SetInitialStack: React.FC = () => {
      const explorerNavStack = useDocExplorer();
      const { push } = useDocExplorerActions();
      useEffect(() => {
        if (explorerNavStack.length === 1) {
          push({ name: 'Query', def: Query });
          push({ name: 'field', def: field });
        }
      }, [explorerNavStack.length, push]);
      return null;
    };

    // Initial render, set initial state
    useGraphiQL.mockImplementation(cb =>
      cb({ ...defaultSchemaContext, schema: initialSchema }),
    );
    const { container, rerender } = render(
      <DocExplorerStore>
        <SetInitialStack />
      </DocExplorerStore>,
    );

    // First proper render of doc explorer
    rerender(
      <DocExplorerStore>
        <DocExplorer />
      </DocExplorerStore>,
    );

    const title = container.querySelector('.graphiql-doc-explorer-title')!;
    expect(title.textContent).toEqual('field');

    // Second render of doc explorer, this time with a new schema, with a different field name
    useGraphiQL.mockImplementation(cb =>
      cb({
        ...defaultSchemaContext,
        schema: makeSchema('field2'), // <<< New schema with a new field name
      }),
    );
    rerender(
      <DocExplorerStore>
        <DocExplorer />
      </DocExplorerStore>,
    );
    const title2 = container.querySelector('.graphiql-doc-explorer-title')!;
    // Because `Query.field` doesn't exist anymore, the top-most item we can render is `Query`
    expect(title2.textContent).toEqual('Query');
  });
});
