/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import TypeLink from '../TypeLink';

import { GraphQLNonNull, GraphQLList, GraphQLString } from 'graphql';

const nonNullType = new GraphQLNonNull(GraphQLString);
const listType = new GraphQLList(GraphQLString);

describe('TypeLink', () => {
  it('should render a string', () => {
    const { container } = render(<TypeLink type={GraphQLString} />);
    expect(container).toHaveTextContent('String');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(container.querySelector('a')).toHaveClass('type-name');
  });
  it('should render a nonnull type', () => {
    const { container } = render(<TypeLink type={nonNullType} />);
    expect(container).toHaveTextContent('String!');
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
  it('should render a list type', () => {
    const { container } = render(<TypeLink type={listType} />);
    expect(container).toHaveTextContent('[String]');
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
  it('should handle a click event', () => {
    const op = jest.fn();
    const { container } = render(<TypeLink type={listType} onClick={op} />);
    fireEvent.click(container.querySelector('a')!);
    expect(op.mock.calls.length).toEqual(1);
    expect(op.mock.calls[0][0]).toEqual(GraphQLString);
  });
  it('should re-render on type change', () => {
    const { container, rerender } = render(<TypeLink type={listType} />);
    expect(container).toHaveTextContent('[String]');
    rerender(<TypeLink type={GraphQLString} />);
    expect(container).toHaveTextContent('String');
  });
});
