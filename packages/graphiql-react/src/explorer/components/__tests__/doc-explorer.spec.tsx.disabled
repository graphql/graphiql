import { render } from '@testing-library/react';
import { GraphQLInt, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { useContext, useEffect } from 'react';

import { SchemaContext, SchemaContextType } from '../../../schema';
import { ExplorerContext, ExplorerContextProvider } from '../../context';
import { DocExplorer } from '../doc-explorer';

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

const defaultSchemaContext: SchemaContextType = {
  fetchError: null,
  introspect() {},
  isFetching: false,
  schema: makeSchema(),
  validationErrors: [],
};

const withErrorSchemaContext: SchemaContextType = {
  fetchError: 'Error fetching schema',
  introspect() {},
  isFetching: false,
  schema: new GraphQLSchema({ description: 'GraphQL Schema for testing' }),
  validationErrors: [],
};

function DocExplorerWithContext() {
  return (
    <ExplorerContextProvider>
      <DocExplorer />
    </ExplorerContextProvider>
  );
}

describe('DocExplorer', () => {
  it('renders spinner when the schema is loading', () => {
    const { container } = render(
      <SchemaContext.Provider
        value={{
          ...defaultSchemaContext,
          isFetching: true,
          schema: undefined,
        }}
      >
        <DocExplorerWithContext />
      </SchemaContext.Provider>,
    );
    const spinner = container.querySelectorAll('.graphiql-spinner');
    expect(spinner).toHaveLength(1);
  });
  it('renders with null schema', () => {
    const { container } = render(
      <SchemaContext.Provider value={{ ...defaultSchemaContext, schema: null }}>
        <DocExplorerWithContext />
      </SchemaContext.Provider>,
    );
    const error = container.querySelectorAll('.graphiql-doc-explorer-error');
    expect(error).toHaveLength(1);
    expect(error[0]).toHaveTextContent('No GraphQL schema available');
  });
  it('renders with schema', () => {
    const { container } = render(
      <SchemaContext.Provider value={defaultSchemaContext}>
        <DocExplorerWithContext />,
      </SchemaContext.Provider>,
    );
    const error = container.querySelectorAll('.graphiql-doc-explorer-error');
    expect(error).toHaveLength(0);
    expect(
      container.querySelector('.graphiql-markdown-description'),
    ).toHaveTextContent('GraphQL Schema for testing');
  });
  it('renders correctly with schema error', () => {
    const { rerender, container } = render(
      <SchemaContext.Provider value={withErrorSchemaContext}>
        <DocExplorerWithContext />,
      </SchemaContext.Provider>,
    );

    const error = container.querySelector('.graphiql-doc-explorer-error');

    expect(error).toHaveTextContent('Error fetching schema');

    rerender(
      <SchemaContext.Provider value={defaultSchemaContext}>
        <DocExplorerWithContext />,
      </SchemaContext.Provider>,
    );

    const errors = container.querySelectorAll('.graphiql-doc-explorer-error');
    expect(errors).toHaveLength(0);
  });
  it('maintains nav stack when possible', () => {
    const initialSchema = makeSchema();
    const Query = initialSchema.getType('Query');
    const { field } = (Query as GraphQLObjectType).getFields();

    // A hacky component to set the initial explorer nav stack
    const SetInitialStack: React.FC = () => {
      const context = useContext(ExplorerContext)!;
      useEffect(() => {
        if (context.explorerNavStack.length === 1) {
          context.push({ name: 'Query', def: Query });
          // eslint-disable-next-line unicorn/no-array-push-push -- false positive, push here accept only 1 argument
          context.push({ name: 'field', def: field });
        }
      }, [context]);
      return null;
    };

    // Initial render, set initial state
    const { container, rerender } = render(
      <SchemaContext.Provider
        value={{
          ...defaultSchemaContext,
          schema: initialSchema,
        }}
      >
        <ExplorerContextProvider>
          <SetInitialStack />
        </ExplorerContextProvider>
      </SchemaContext.Provider>,
    );

    // First proper render of doc explorer
    rerender(
      <SchemaContext.Provider
        value={{
          ...defaultSchemaContext,
          schema: initialSchema,
        }}
      >
        <ExplorerContextProvider>
          <DocExplorer />
        </ExplorerContextProvider>
      </SchemaContext.Provider>,
    );

    const [title] = container.querySelectorAll('.graphiql-doc-explorer-title');
    expect(title.textContent).toEqual('field');

    // Second render of doc explorer, this time with a new schema, with _same_ field name
    rerender(
      <SchemaContext.Provider
        value={{
          ...defaultSchemaContext,
          schema: makeSchema(), // <<< New, but equivalent, schema
        }}
      >
        <ExplorerContextProvider>
          <DocExplorer />
        </ExplorerContextProvider>
      </SchemaContext.Provider>,
    );
    const [title2] = container.querySelectorAll('.graphiql-doc-explorer-title');
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
      const context = useContext(ExplorerContext)!;
      useEffect(() => {
        if (context.explorerNavStack.length === 1) {
          context.push({ name: 'Query', def: Query });
          // eslint-disable-next-line unicorn/no-array-push-push -- false positive, push here accept only 1 argument
          context.push({ name: 'field', def: field });
        }
      }, [context]);
      return null;
    };

    // Initial render, set initial state
    const { container, rerender } = render(
      <SchemaContext.Provider
        value={{
          ...defaultSchemaContext,
          schema: initialSchema,
        }}
      >
        <ExplorerContextProvider>
          <SetInitialStack />
        </ExplorerContextProvider>
      </SchemaContext.Provider>,
    );

    // First proper render of doc explorer
    rerender(
      <SchemaContext.Provider
        value={{
          ...defaultSchemaContext,
          schema: initialSchema,
        }}
      >
        <ExplorerContextProvider>
          <DocExplorer />
        </ExplorerContextProvider>
      </SchemaContext.Provider>,
    );

    const [title] = container.querySelectorAll('.graphiql-doc-explorer-title');
    expect(title.textContent).toEqual('field');

    // Second render of doc explorer, this time with a new schema, with different field name
    rerender(
      <SchemaContext.Provider
        value={{
          ...defaultSchemaContext,
          schema: makeSchema('field2'), // <<< New schema with new field name
        }}
      >
        <ExplorerContextProvider>
          <DocExplorer />
        </ExplorerContextProvider>
      </SchemaContext.Provider>,
    );
    const [title2] = container.querySelectorAll('.graphiql-doc-explorer-title');
    // Because `Query.field` doesn't exist any more, the top-most item we can render is `Query`
    expect(title2.textContent).toEqual('Query');
  });
});
