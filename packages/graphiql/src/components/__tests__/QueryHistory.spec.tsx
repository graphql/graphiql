/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React, { ComponentProps } from 'react';
import { render, fireEvent } from '@testing-library/react';

import { QueryHistoryItem } from '../QueryHistory';
import {
  mockOperationName1,
  mockQuery1,
  mockVariables1,
  mockHeaders1,
} from './fixtures';
import { HistoryContextProvider } from '@graphiql/react';

type QueryHistoryItemProps = ComponentProps<typeof QueryHistoryItem>;

function QueryHistoryItemWithContext(props: QueryHistoryItemProps) {
  return (
    <HistoryContextProvider>
      <QueryHistoryItem {...props} />
    </HistoryContextProvider>
  );
}

const baseMockProps: QueryHistoryItemProps = {
  item: {
    query: mockQuery1,
    variables: mockVariables1,
    headers: mockHeaders1,
    favorite: false,
  },
  onSelect: () => {},
};

function getMockProps(
  customProps?: Partial<QueryHistoryItemProps>,
): QueryHistoryItemProps {
  return {
    ...baseMockProps,
    ...customProps,
    item: { ...baseMockProps.item, ...customProps?.item },
  };
}

describe('QueryHistoryItem', () => {
  it('renders operationName if label is not provided', () => {
    const otherMockProps = { item: { operationName: mockOperationName1 } };
    const props = getMockProps(otherMockProps);
    const { container } = render(<QueryHistoryItemWithContext {...props} />);
    expect(container.querySelector('button.history-label')!.textContent).toBe(
      mockOperationName1,
    );
  });

  it('renders a string version of the query if label or operation name are not provided', () => {
    const { container } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    expect(container.querySelector('button.history-label')!.textContent).toBe(
      mockQuery1
        .split('\n')
        .filter(line => line.indexOf('#') !== 0)
        .join(''),
    );
  });

  it('calls onSelect with the correct arguments when history label button is clicked', () => {
    const onSelectSpy = jest.spyOn(baseMockProps, 'onSelect');
    const otherMockProps = { item: { operationName: mockOperationName1 } };
    const mockProps = getMockProps(otherMockProps);
    const { container } = render(
      <QueryHistoryItemWithContext {...mockProps} />,
    );
    fireEvent.click(container.querySelector('button.history-label')!);
    expect(onSelectSpy).toHaveBeenCalledWith(mockProps.item);
  });

  it('renders label input if the edit label button is clicked', () => {
    const { container } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    fireEvent.click(container.querySelector('[aria-label="Edit label"]')!);
    expect(container.querySelectorAll('li.editable').length).toBe(1);
    expect(container.querySelectorAll('input').length).toBe(1);
    expect(container.querySelectorAll('button.history-label').length).toBe(0);
  });
});
