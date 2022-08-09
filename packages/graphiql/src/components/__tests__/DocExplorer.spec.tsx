/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { render } from '@testing-library/react';
import {
  ExplorerContextProvider,
  SchemaContext,
  SchemaContextType,
} from '@graphiql/react';

import { DocExplorer } from '../DocExplorer';
import { ExampleSchema } from './ExampleSchema';

const defaultSchemaContext: SchemaContextType = {
  fetchError: null,
  introspect() {},
  isFetching: false,
  schema: ExampleSchema,
  validationErrors: [],
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
        }}
      >
        <DocExplorerWithContext />
      </SchemaContext.Provider>,
    );
    const spinner = container.querySelectorAll('.spinner-container');
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
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'GraphQL Schema for testing',
    );
  });
});
