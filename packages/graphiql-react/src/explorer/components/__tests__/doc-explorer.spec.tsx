import { render } from '@testing-library/react';
import { GraphQLSchema } from 'graphql';

import { SchemaContext, SchemaContextType } from '../../../schema';
import { ExplorerContextProvider } from '../../context';
import { DocExplorer } from '../doc-explorer';

const defaultSchemaContext: SchemaContextType = {
  fetchError: null,
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
});
