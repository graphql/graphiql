import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

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
      />,
    );
    const cats = W.find('.doc-category-item');
    expect(cats.at(0).text()).to.equal('string: String');
    expect(cats.at(1).text()).to.equal('union: exampleUnion');
    expect(cats.at(2).text()).to.equal(
      'fieldWithArgs(stringArg: String): String',
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
      />,
    );
    W.find('TypeLink')
      .at(0)
      .simulate('click');
    expect(onClickType.mock.calls.length).to.equal(1);
    expect(onClickType.mock.calls[0][0]).to.equal(GraphQLString);

    W.find('.field-name')
      .at(0)
      .simulate('click');

    expect(onClickField.mock.calls.length).to.equal(1);
    expect(onClickField.mock.calls[0][0].name).to.equal('string');
    expect(onClickField.mock.calls[0][0].type).to.equal(GraphQLString);
    expect(onClickField.mock.calls[0][1]).to.equal(ExampleQuery);
  });

  it('renders deprecated fields when you click to see them', () => {
    const W = mount(
      <TypeDoc
        schema={ExampleSchema}
        type={ExampleQuery}
        onClickType={jest.fn()}
      />,
    );
    let cats = W.find('.doc-category-item');
    expect(cats.length).to.equal(3);

    W.find('.show-btn').simulate('click');

    cats = W.find('.doc-category-item');
    expect(cats.length).to.equal(4);
    expect(
      W.find('.field-name')
        .at(3)
        .text(),
    ).to.equal('deprecatedField');
    expect(
      W.find('.doc-deprecation').at(0).text()
    ).to.equal('example deprecation reason\n');
  });

  it('renders a Union type', () => {
    const W = mount(<TypeDoc schema={ExampleSchema} type={ExampleUnion} />);
    expect(
      W.find('.doc-category-title')
        .at(0)
        .text(),
    ).to.equal('possible types');
  });

  it('renders an Enum type', () => {
    const W = mount(<TypeDoc schema={ExampleSchema} type={ExampleEnum} />);
    expect(
      W.find('.doc-category-title')
        .at(0)
        .text(),
    ).to.equal('values');
    const enums = W.find('EnumValue');
    expect(enums.at(0).props().value.value).to.equal('Value 1');
    expect(enums.at(1).props().value.value).to.equal('Value 2');
  });

  it('shows deprecated enum values on click', () => {
    const W = mount(<TypeDoc schema={ExampleSchema} type={ExampleEnum} />);
    expect(W.state().showDeprecated).to.equal(false);
    const titles = W.find('.doc-category-title');
    expect(titles.at(0).text()).to.equal('values');
    expect(titles.at(1).text()).to.equal('deprecated values');
    let enums = W.find('EnumValue');
    expect(enums.length).to.equal(2);

    // click button to show deprecated enum values
    W.find('.show-btn').simulate('click');
    expect(W.state().showDeprecated).to.equal(true);
    enums = W.find('EnumValue');
    expect(enums.length).to.equal(3);
    expect(enums.at(2).props().value.value).to.equal('Value 3');
    expect(
      W.find('.doc-deprecation')
        .at(1)
        .text(),
    ).to.equal('Only two are needed\n');
  });
});
