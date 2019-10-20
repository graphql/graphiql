/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { mount } from 'enzyme';

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
    const W = mount(
      <FieldDoc
        field={exampleObject.getFields().string}
        onClickType={jest.fn()}
      />
    );
    expect(W.find('MarkdownContent').text()).toEqual('No Description\n');
    expect(W.find('TypeLink').text()).toEqual('String');
    expect(W.find('Argument').length).toEqual(0);
  });

  it('should re-render on field change', () => {
    const W = mount(
      <FieldDoc
        field={exampleObject.getFields().string}
        onClickType={jest.fn()}
      />
    );
    expect(W.find('MarkdownContent').text()).toEqual('No Description\n');
    expect(W.find('TypeLink').text()).toEqual('String');
    expect(W.find('Argument').length).toEqual(0);
  });

  it('should render a string field with arguments', () => {
    const W = mount(
      <FieldDoc
        field={exampleObject.getFields().stringWithArgs}
        onClickType={jest.fn()}
      />
    );
    expect(
      W.find('TypeLink')
        .at(0)
        .text()
    ).toEqual('String');
    expect(
      W.find('.doc-type-description')
        .at(0)
        .text()
    ).toEqual('Example String field with arguments\n');
    expect(W.find('Argument').length).toEqual(1);
    expect(W.find('Argument').text()).toEqual('stringArg: String');
  });
});
