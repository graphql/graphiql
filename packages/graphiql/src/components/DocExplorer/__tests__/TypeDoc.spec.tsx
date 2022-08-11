/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { ExplorerContext, SchemaContext } from '@graphiql/react';
import {
  // @ts-expect-error
  fireEvent,
  render,
} from '@testing-library/react';
import { GraphQLNamedType } from 'graphql';
import React from 'react';

import {
  ExampleSchema,
  ExampleQuery,
  ExampleUnion,
  ExampleEnum,
} from '../../__tests__/ExampleSchema';
import TypeDoc from '../TypeDoc';
import { mockExplorerContextValue, unwrapType } from './test-utils';

function TypeDocWithContext(props: { type: GraphQLNamedType }) {
  return (
    <SchemaContext.Provider
      value={{
        fetchError: null,
        introspect() {},
        isFetching: false,
        schema: ExampleSchema,
        validationErrors: [],
      }}
    >
      <ExplorerContext.Provider
        value={mockExplorerContextValue({
          name: unwrapType(props.type).name,
          def: props.type,
        })}
      >
        <TypeDoc />
      </ExplorerContext.Provider>
    </SchemaContext.Provider>
  );
}

describe('TypeDoc', () => {
  it('renders a top-level query object type', () => {
    const { container } = render(<TypeDocWithContext type={ExampleQuery} />);
    const description = container.querySelectorAll('.doc-type-description');
    expect(description).toHaveLength(1);
    expect(description[0]).toHaveTextContent('Query description\nSecond line', {
      normalizeWhitespace: false,
    });

    const cats = container.querySelectorAll('.doc-category-item');
    expect(cats[0]).toHaveTextContent('string: String');
    expect(cats[1]).toHaveTextContent('union: exampleUnion');
    expect(cats[2]).toHaveTextContent(
      'fieldWithArgs(stringArg: String): String',
    );
  });

  it('renders deprecated fields when you click to see them', () => {
    const { container } = render(<TypeDocWithContext type={ExampleQuery} />);
    let cats = container.querySelectorAll('.doc-category-item');
    expect(cats).toHaveLength(3);

    fireEvent.click(container.querySelector('.show-btn')!);

    cats = container.querySelectorAll('.doc-category-item');
    expect(cats).toHaveLength(4);
    expect(container.querySelectorAll('.field-name')[3]).toHaveTextContent(
      'deprecatedField',
    );
    expect(container.querySelector('.doc-deprecation')).toHaveTextContent(
      'example deprecation reason',
    );
  });

  it('renders a Union type', () => {
    const { container } = render(<TypeDocWithContext type={ExampleUnion} />);
    expect(container.querySelector('.doc-category-title')).toHaveTextContent(
      'possible types',
    );
  });

  it('renders an Enum type', () => {
    const { container } = render(<TypeDocWithContext type={ExampleEnum} />);
    expect(container.querySelector('.doc-category-title')).toHaveTextContent(
      'values',
    );
    const enums = container.querySelectorAll('.enum-value');
    expect(enums[0]).toHaveTextContent('value1');
    expect(enums[1]).toHaveTextContent('value2');
  });

  it('shows deprecated enum values on click', () => {
    const { getByText, container } = render(
      <TypeDocWithContext type={ExampleEnum} />,
    );
    const showBtn = getByText('Show deprecated values...');
    expect(showBtn).toBeInTheDocument();
    const titles = container.querySelectorAll('.doc-category-title');
    expect(titles[0]).toHaveTextContent('values');
    expect(titles[1]).toHaveTextContent('deprecated values');
    let enums = container.querySelectorAll('.enum-value');
    expect(enums).toHaveLength(2);

    // click button to show deprecated enum values
    fireEvent.click(showBtn);
    expect(showBtn).not.toBeInTheDocument();
    enums = container.querySelectorAll('.enum-value');
    expect(enums).toHaveLength(3);
    expect(enums[2]).toHaveTextContent('value3');
    expect(container.querySelector('.doc-deprecation')).toHaveTextContent(
      'Only two are needed',
    );
  });
});
