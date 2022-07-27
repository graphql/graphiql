import { render } from '@testing-library/react';

import { SchemaContext, SchemaContextType } from '../../../schema';
import { ExplorerContextProvider } from '../../context';
import { DocExplorer } from '../doc-explorer';
import { ExampleSchema } from './example-schema';

const defaultSchemaContext: SchemaContextType = {
  fetchError: null,
  introspect() {},
  isFetching: false,
  schema: ExampleSchema,
  setFetchError() {},
  setSchema() {},
  validationErrors: null,
};

function DocExplorerWithContext(
  props: React.ComponentProps<typeof DocExplorer>,
) {
  return (
    <ExplorerContextProvider>
      <DocExplorer {...props} />
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
        }}>
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
    const error = container.querySelectorAll('.error-container');
    expect(error).toHaveLength(1);
    expect(error[0]).toHaveTextContent('No Schema Available');
  });
  it('renders with schema', () => {
    const { container } = render(
      <SchemaContext.Provider value={defaultSchemaContext}>
        <DocExplorerWithContext />,
      </SchemaContext.Provider>,
    );
    const error = container.querySelectorAll('.error-container');
    expect(error).toHaveLength(0);
    expect(
      container.querySelector('.graphiql-markdown-description'),
    ).toHaveTextContent('GraphQL Schema for testing');
  });
});
