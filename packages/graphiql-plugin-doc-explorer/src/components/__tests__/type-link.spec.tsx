import { FC, useEffect } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { GraphQLNonNull, GraphQLList, GraphQLString } from 'graphql';
import { docExplorerStore, useDocExplorer } from '../../context';
import { TypeLink } from '../type-link';
import { unwrapType } from './test-utils';

const nonNullType = new GraphQLNonNull(GraphQLString);
const listType = new GraphQLList(GraphQLString);

const TypeLinkConsumer: FC = () => {
  const explorerNavStack = useDocExplorer();
  return (
    <span data-testid="nav-stack">
      {JSON.stringify(explorerNavStack[explorerNavStack.length + 1])}
    </span>
  );
};

const TypeLinkWithContext: typeof TypeLink = ({ type }) => {
  useEffect(() => {
    docExplorerStore.setState({
      explorerNavStack: [
        {
          name: unwrapType(type).name,
          def: unwrapType(type),
        },
      ],
    });
  }, [type]);

  return (
    <>
      <TypeLink type={type} />
      {/* Print the top of the current nav stack for test assertions */}
      <TypeLinkConsumer />
    </>
  );
};

describe('TypeLink', () => {
  it('should render a string', () => {
    const { container } = render(<TypeLinkWithContext type={GraphQLString} />);
    expect(container).toHaveTextContent('String');
    expect(container.querySelectorAll('a')).toHaveLength(1);
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
