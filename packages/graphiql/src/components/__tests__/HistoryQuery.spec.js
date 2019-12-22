/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { mount } from 'enzyme';
import HistoryQuery from '../HistoryQuery';
import { mockOperationName1, mockQuery1, mockVariables1 } from './fixtures';

const noOp = () => {};

const baseMockProps = {
  favorite: false,
  handleEditLabel: noOp,
  handleToggleFavorite: noOp,
  onSelect: noOp,
  query: mockQuery1,
  variables: mockVariables1,
};

function getMockProps(customProps) {
  return {
    ...baseMockProps,
    ...customProps,
  };
}

describe('HistoryQuery', () => {
  it('renders operationName if label is not provided', () => {
    const otherMockProps = { operationName: mockOperationName1 };
    const props = getMockProps(otherMockProps);
    const W = mount(<HistoryQuery {...props} />);
    expect(
      W.find('button.history-label')
        .first()
        .text(),
    ).toBe(mockOperationName1);
  });

  it('renders a string version of the query if label or operation name are not provided', () => {
    const W = mount(<HistoryQuery {...getMockProps()} />);
    expect(
      W.find('button.history-label')
        .first()
        .text(),
    ).toBe(
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
    const W = mount(<HistoryQuery {...getMockProps(otherMockProps)} />);
    W.find('button.history-label').simulate('click');
    W.update();
    expect(onSelectSpy).toHaveBeenCalledWith(
      mockQuery1,
      mockVariables1,
      mockOperationName1,
      undefined,
    );
  });

  it('renders label input if the edit label button is clicked', () => {
    const W = mount(<HistoryQuery {...getMockProps()} />);
    W.find({ 'aria-label': 'Edit label' })
      .first()
      .simulate('click');
    W.update();
    expect(W.find('li.editable').length).toBe(1);
    expect(W.find('input').length).toBe(1);
    expect(W.find('button.history-label').length).toBe(0);
  });
});
