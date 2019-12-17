/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { mount } from 'enzyme';

import { QueryHistory } from '../QueryHistory';
import HistoryQuery from '../HistoryQuery';
import { getMockStorage } from './helpers/storage';
import {
  mockBadQuery,
  mockQuery1,
  mockQuery2,
  mockVariables1,
  mockVariables2,
  mockOperationName1,
  mockOperationName2,
} from './fixtures';

function getMockProps(customProps) {
  return {
    query: mockQuery1,
    variables: mockVariables1,
    operationName: mockOperationName1,
    queryID: 1,
    onSelectQuery: () => {},
    storage: getMockStorage(),
    ...customProps,
  };
}

describe('QueryHistory', () => {
  it('will not save invalid queries', () => {
    const W = mount(<QueryHistory {...getMockProps()} />);
    const instance = W.instance();
    instance.updateHistory(mockBadQuery);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(0);
  });

  it('will save if there was not a previously saved query', () => {
    const W = mount(<QueryHistory {...getMockProps()} />);
    const instance = W.instance();
    instance.updateHistory(mockQuery1, mockVariables1, mockOperationName1);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(1);
  });

  it('will not save a query if the query is the same as previous query', () => {
    const W = mount(<QueryHistory {...getMockProps()} />);
    const instance = W.instance();
    instance.updateHistory(mockQuery1, mockVariables1, mockOperationName1);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(1);
    instance.updateHistory(mockQuery1, mockVariables1, mockOperationName1);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(1);
  });

  it('will save if new query is different than previous query', () => {
    const W = mount(<QueryHistory {...getMockProps()} />);
    const instance = W.instance();
    instance.updateHistory(mockQuery1, mockVariables1, mockOperationName1);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(1);
    instance.updateHistory(mockQuery2, undefined, mockOperationName2);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(2);
  });

  it('will save query if variables are different ', () => {
    const W = mount(<QueryHistory {...getMockProps()} />);
    const instance = W.instance();
    instance.updateHistory(mockQuery1, mockVariables1, mockOperationName1);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(1);
    instance.updateHistory(mockQuery1, mockVariables2, mockOperationName1);
    W.update();
    expect(W.find(HistoryQuery).length).toBe(2);
  });
});
