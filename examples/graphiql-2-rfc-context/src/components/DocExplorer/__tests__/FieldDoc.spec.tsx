/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { render } from '@testing-library/react';

import FieldDoc from '../FieldDoc';

import { GraphQLString, GraphQLObjectType } from 'graphql';

const exampleObject = new GraphQLObjectType({
  name: 'Query',
  fields: {
    string: {
      name: 'simpleStringField',
      type: GraphQLString,
    },
    stringWithArgs: {
      name: 'stringWithArgs',
      type: GraphQLString,
      description: 'Example String field with arguments',
      args: {
        stringArg: {
          name: 'stringArg',
          type: GraphQLString,
        },
      },
    },
  },
});

describe('FieldDoc', () => {
  it('should render a simple string field', () => {
    const { container } = render(
      <FieldDoc
        field={exampleObject.getFields().string}
        onClickType={jest.fn()}
      />,
    );
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'No Description',
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.arg')).not.toBeInTheDocument();
  });

  it('should re-render on field change', () => {
    const { container, rerender } = render(
      <FieldDoc
        field={exampleObject.getFields().string}
        onClickType={jest.fn()}
      />,
    );
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'No Description',
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.arg')).not.toBeInTheDocument();

    rerender(
      <FieldDoc
        field={exampleObject.getFields().stringWithArgs}
        onClickType={jest.fn()}
      />,
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'Example String field with arguments',
    );
  });

  it('should render a string field with arguments', () => {
    const { container } = render(
      <FieldDoc
        field={exampleObject.getFields().stringWithArgs}
        onClickType={jest.fn()}
      />,
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'Example String field with arguments',
    );
    expect(container.querySelectorAll('.arg')).toHaveLength(1);
    expect(container.querySelector('.arg')).toHaveTextContent(
      'stringArg: String',
    );
  });
});
