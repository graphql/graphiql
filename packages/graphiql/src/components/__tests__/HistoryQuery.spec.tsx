/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import HistoryQuery, { HistoryQueryProps } from '../HistoryQuery';
import {
  mockOperationName1,
  mockQuery1,
  mockVariables1,
  mockHeaders1,
} from './fixtures';

const noOp = () => {};

const baseMockProps = {
  favorite: false,
  handleEditLabel: noOp,
  handleToggleFavorite: noOp,
  onSelect: noOp,
  query: mockQuery1,
  variables: mockVariables1,
  headers: mockHeaders1,
};

function getMockProps(
  customProps?: Partial<HistoryQueryProps>,
): HistoryQueryProps {
  return {
    ...baseMockProps,
    ...customProps,
  };
}

describe('HistoryQuery', () => {
  it('renders operationName if label is not provided', () => {
    const otherMockProps = { operationName: mockOperationName1 };
    const props = getMockProps(otherMockProps);
    const { container } = render(<HistoryQuery {...props} />);
    expect(container.querySelector('button.history-label')!.textContent).toBe(
      mockOperationName1,
    );
  });

  it('renders a string version of the query if label or operation name are not provided', () => {
    const { container } = render(<HistoryQuery {...getMockProps()} />);
    expect(container.querySelector('button.history-label')!.textContent).toBe(
      mockQuery1
        .split('\n')
        .filter(line => line.indexOf('#') !== 0)
        .join(''),
    );
  });

  it('calls onSelect with the correct arguments when history label button is clicked', () => {
    const onSelectSpy = jest.spyOn(baseMockProps, 'onSelect');
    const otherMockProps = {
      operationName: mockOperationName1,
    };
    const { container } = render(
      <HistoryQuery {...getMockProps(otherMockProps)} />,
    );
    fireEvent.click(container.querySelector('button.history-label')!);
    expect(onSelectSpy).toHaveBeenCalledWith(
      mockQuery1,
      mockVariables1,
      mockHeaders1,
      mockOperationName1,
      undefined,
    );
  });

  it('renders label input if the edit label button is clicked', () => {
    const { container } = render(<HistoryQuery {...getMockProps()} />);
    fireEvent.click(container.querySelector('[aria-label="Edit label"]')!);
    expect(container.querySelectorAll('li.editable').length).toBe(1);
    expect(container.querySelectorAll('input').length).toBe(1);
    expect(container.querySelectorAll('button.history-label').length).toBe(0);
  });
});
