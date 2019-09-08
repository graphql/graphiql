/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { mount } from 'enzyme';

import TypeLink from '../TypeLink';

import { GraphQLNonNull, GraphQLList, GraphQLString } from 'graphql';

const nonNullType = new GraphQLNonNull(GraphQLString);
const listType = new GraphQLList(GraphQLString);

describe('TypeLink', () => {
  it('should render a string', () => {
    const instance = mount(<TypeLink type={GraphQLString} />);
    expect(instance.text()).toEqual('String');
    expect(instance.find('a').length).toEqual(1);
    expect(instance.find('a').hasClass('type-name')).toEqual(true);
  });
  it('should render a nonnull type', () => {
    const instance = mount(<TypeLink type={nonNullType} />);
    expect(instance.text()).toEqual('String!');
    expect(instance.find('span').length).toEqual(1);
  });
  it('should render a list type', () => {
    const instance = mount(<TypeLink type={listType} />);
    expect(instance.text()).toEqual('[String]');
    expect(instance.find('span').length).toEqual(1);
  });
  it('should handle a click event', () => {
    const op = jest.fn();
    const instance = mount(<TypeLink type={listType} onClick={op} />);
    instance.find('a').simulate('click');
    expect(op.mock.calls.length).toEqual(1);
    expect(op.mock.calls[0][0]).toEqual(GraphQLString);
  });
  it('should re-render on type change', () => {
    const instance = mount(<TypeLink type={listType} />);
    expect(instance.text()).toEqual('[String]');
    instance.setProps({ type: GraphQLString });
    expect(instance.text()).toEqual('String');
  });
});
