/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { GraphQLString } from 'graphql';

import TypeDoc from '../TypeDoc';

import {
  ExampleSchema,
  ExampleQuery,
  ExampleUnion,
  ExampleEnum,
} from '../../__tests__/ExampleSchema';

describe('TypeDoc', () => {
  it('renders a top-level query object type', () => {
    const { container } = render(
      // @ts-ignore
      <TypeDoc
        schema={ExampleSchema}
        type={ExampleQuery}
        onClickType={jest.fn()}
      />,
    );
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

  it('handles onClickField and onClickType', () => {
    const onClickType = jest.fn();
    const onClickField = jest.fn();
    const { container } = render(
      <TypeDoc
        schema={ExampleSchema}
        type={ExampleQuery}
        onClickType={onClickType}
        onClickField={onClickField}
      />,
    );
    fireEvent.click(container.querySelector('.type-name')!);
    expect(onClickType.mock.calls.length).toEqual(1);
    expect(onClickType.mock.calls[0][0]).toEqual(GraphQLString);

    fireEvent.click(container.querySelector('.field-name')!);
    expect(onClickField.mock.calls.length).toEqual(1);
    expect(onClickField.mock.calls[0][0].name).toEqual('string');
    expect(onClickField.mock.calls[0][0].type).toEqual(GraphQLString);
    expect(onClickField.mock.calls[0][1]).toEqual(ExampleQuery);
  });

  it('renders deprecated fields when you click to see them', () => {
    const { container } = render(
      // @ts-ignore
      <TypeDoc
        schema={ExampleSchema}
        type={ExampleQuery}
        onClickType={jest.fn()}
      />,
    );
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
    const { container } = render(
      // @ts-ignore
      <TypeDoc schema={ExampleSchema} type={ExampleUnion} />,
    );
    expect(container.querySelector('.doc-category-title')).toHaveTextContent(
      'possible types',
    );
  });

  it('renders an Enum type', () => {
    const { container } = render(
      // @ts-ignore
      <TypeDoc schema={ExampleSchema} type={ExampleEnum} />,
    );
    expect(container.querySelector('.doc-category-title')).toHaveTextContent(
      'values',
    );
    const enums = container.querySelectorAll('.enum-value');
    expect(enums[0]).toHaveTextContent('value1');
    expect(enums[1]).toHaveTextContent('value2');
  });

  it('shows deprecated enum values on click', () => {
    const { getByText, container } = render(
      // @ts-ignore
      <TypeDoc schema={ExampleSchema} type={ExampleEnum} />,
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
