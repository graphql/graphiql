import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

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

describe.only('FieldDoc', () => {
  it('should render a simple string field', () => {
    const W = mount(
      <FieldDoc
        field={exampleObject.getFields().string}
        onClickType={jest.fn()}
      />,
    );
    expect(W.find('MarkdownContent').text()).to.equal('No Description\n');
    expect(W.find('TypeLink').text()).to.equal('String');
    expect(W.find('Argument').length).to.equal(0);
  });

  it('should re-render on field change', () => {
    const W = mount(
      <FieldDoc
        field={exampleObject.getFields().string}
        onClickType={jest.fn()}
      />,
    );
    expect(W.find('MarkdownContent').text()).to.equal('No Description\n');
    expect(W.find('TypeLink').text()).to.equal('String');
    expect(W.find('Argument').length).to.equal(0);
  });

  it('should render a string field with arguments', () => {
    const W = mount(
      <FieldDoc
        field={exampleObject.getFields().stringWithArgs}
        onClickType={jest.fn()}
      />,
    );
    expect(
      W.find('TypeLink')
        .at(0)
        .text(),
    ).to.equal('String');
    expect(
      W.find('.doc-type-description')
        .at(0)
        .text(),
    ).to.equal('Example String field with arguments\n');
    expect(W.find('Argument').length).to.equal(1);
    expect(W.find('Argument').text()).to.equal('stringArg: String');
  });
});
