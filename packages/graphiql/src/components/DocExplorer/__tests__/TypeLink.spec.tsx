/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { ExplorerContext } from '@graphiql/react';
import {
  // @ts-expect-error
  fireEvent,
  render,
} from '@testing-library/react';
import { GraphQLNonNull, GraphQLList, GraphQLString } from 'graphql';
import React, { ComponentProps } from 'react';

import TypeLink from '../TypeLink';
import { mockExplorerContextValue, unwrapType } from './test-utils';

const nonNullType = new GraphQLNonNull(GraphQLString);
const listType = new GraphQLList(GraphQLString);

function TypeLinkWithContext(props: ComponentProps<typeof TypeLink>) {
  return (
    <ExplorerContext.Provider
      value={mockExplorerContextValue({
        name: unwrapType(props.type).name,
        def: unwrapType(props.type),
      })}
    >
      <TypeLink {...props} />
      {/* Print the top of the current nav stack for test assertions */}
      <ExplorerContext.Consumer>
        {({ explorerNavStack }) => (
          <span data-testid="nav-stack">
            {JSON.stringify(explorerNavStack[explorerNavStack.length + 1])}
          </span>
        )}
      </ExplorerContext.Consumer>
    </ExplorerContext.Provider>
  );
}

describe('TypeLink', () => {
  it('should render a string', () => {
    const { container } = render(<TypeLinkWithContext type={GraphQLString} />);
    expect(container).toHaveTextContent('String');
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(container.querySelector('a')).toHaveClass('type-name');
  });
  it('should render a non-null type', () => {
    const { container } = render(<TypeLinkWithContext type={nonNullType} />);
    expect(container).toHaveTextContent('String!');
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
  it('should render a list type', () => {
    const { container } = render(<TypeLinkWithContext type={listType} />);
    expect(container).toHaveTextContent('[String]');
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
  it('should push to the nav stack on click', () => {
    const { container, getByTestId } = render(
      <TypeLinkWithContext type={listType} />,
    );
    fireEvent.click(container.querySelector('a')!);
    expect(getByTestId('nav-stack')).toHaveTextContent('');
  });
  it('should re-render on type change', () => {
    const { container, rerender } = render(
      <TypeLinkWithContext type={listType} />,
    );
    expect(container).toHaveTextContent('[String]');
    rerender(<TypeLinkWithContext type={GraphQLString} />);
    expect(container).toHaveTextContent('String');
  });
});
