/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { mount } from 'enzyme';

import { GraphQLString } from 'graphql';

import TypeDoc from '../TypeDoc';

import {
  ExampleSchema,
  ExampleQuery,
  ExampleUnion,
  ExampleEnum,
} from '../../__tests__/ExampleSchema';

describe('TypeDoc', () => {
  it('renders a top-level query object type', () => {
    const W = mount(
      <TypeDoc
        schema={ExampleSchema}
        type={ExampleQuery}
        onClickType={jest.fn()}
      />
    );
    const cats = W.find('.doc-category-item');
    expect(cats.at(0).text()).toEqual('string: String');
    expect(cats.at(1).text()).toEqual('union: exampleUnion');
    expect(cats.at(2).text()).toEqual(
      'fieldWithArgs(stringArg: String): String'
    );
  });

  it('handles onClickField and onClickType', () => {
    const onClickType = jest.fn();
    const onClickField = jest.fn();
    const W = mount(
      <TypeDoc
        schema={ExampleSchema}
        type={ExampleQuery}
        onClickType={onClickType}
        onClickField={onClickField}
      />
    );
    W.find('TypeLink')
      .at(0)
      .simulate('click');
    expect(onClickType.mock.calls.length).toEqual(1);
    expect(onClickType.mock.calls[0][0]).toEqual(GraphQLString);

    W.find('.field-name')
      .at(0)
      .simulate('click');

    expect(onClickField.mock.calls.length).toEqual(1);
    expect(onClickField.mock.calls[0][0].name).toEqual('string');
    expect(onClickField.mock.calls[0][0].type).toEqual(GraphQLString);
    expect(onClickField.mock.calls[0][1]).toEqual(ExampleQuery);
  });

  it('renders deprecated fields when you click to see them', () => {
    const W = mount(
      <TypeDoc
        schema={ExampleSchema}
        type={ExampleQuery}
        onClickType={jest.fn()}
      />
    );
    let cats = W.find('.doc-category-item');
    expect(cats.length).toEqual(3);

    W.find('.show-btn').simulate('click');

    cats = W.find('.doc-category-item');
    expect(cats.length).toEqual(4);
    expect(
      W.find('.field-name')
        .at(3)
        .text()
    ).toEqual('deprecatedField');
    expect(
      W.find('.doc-deprecation')
        .at(0)
        .text()
    ).toEqual('example deprecation reason\n');
  });

  it('renders a Union type', () => {
    const W = mount(<TypeDoc schema={ExampleSchema} type={ExampleUnion} />);
    expect(
      W.find('.doc-category-title')
        .at(0)
        .text()
    ).toEqual('possible types');
  });

  it('renders an Enum type', () => {
    const W = mount(<TypeDoc schema={ExampleSchema} type={ExampleEnum} />);
    expect(
      W.find('.doc-category-title')
        .at(0)
        .text()
    ).toEqual('values');
    const enums = W.find('EnumValue');
    expect(enums.at(0).props().value.value).toEqual('Value 1');
    expect(enums.at(1).props().value.value).toEqual('Value 2');
  });

  it('shows deprecated enum values on click', () => {
    const W = mount(<TypeDoc schema={ExampleSchema} type={ExampleEnum} />);
    expect(W.state().showDeprecated).toEqual(false);
    const titles = W.find('.doc-category-title');
    expect(titles.at(0).text()).toEqual('values');
    expect(titles.at(1).text()).toEqual('deprecated values');
    let enums = W.find('EnumValue');
    expect(enums.length).toEqual(2);

    // click button to show deprecated enum values
    W.find('.show-btn').simulate('click');
    expect(W.state().showDeprecated).toEqual(true);
    enums = W.find('EnumValue');
    expect(enums.length).toEqual(3);
    expect(enums.at(2).props().value.value).toEqual('Value 3');
    expect(
      W.find('.doc-deprecation')
        .at(1)
        .text()
    ).toEqual('Only two are needed\n');
  });
});
