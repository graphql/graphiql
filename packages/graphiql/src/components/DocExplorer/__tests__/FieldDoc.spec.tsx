/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { ExplorerContext, ExplorerFieldDef } from '@graphiql/react';
import {
  // @ts-expect-error
  fireEvent,
  render,
} from '@testing-library/react';
import { GraphQLString, GraphQLObjectType, Kind } from 'graphql';
import React from 'react';

import FieldDoc from '../FieldDoc';
import { mockExplorerContextValue } from './test-utils';

const exampleObject = new GraphQLObjectType({
  name: 'Query',
  fields: {
    string: {
      type: GraphQLString,
    },
    stringWithArgs: {
      type: GraphQLString,
      description: 'Example String field with arguments',
      args: {
        stringArg: {
          type: GraphQLString,
        },
        deprecatedStringArg: {
          type: GraphQLString,
          deprecationReason: 'no longer used',
        },
      },
    },
    stringWithDirective: {
      type: GraphQLString,
      astNode: {
        kind: Kind.FIELD_DEFINITION,
        name: {
          kind: Kind.NAME,
          value: 'stringWithDirective',
        },
        type: {
          kind: Kind.NAMED_TYPE,
          name: {
            kind: Kind.NAME,
            value: 'GraphQLString',
          },
        },
        directives: [
          {
            kind: Kind.DIRECTIVE,
            name: {
              kind: Kind.NAME,
              value: 'development',
            },
          },
        ],
      },
    },
  },
});

function FieldDocWithContext(props: { field: ExplorerFieldDef }) {
  return (
    <ExplorerContext.Provider
      value={mockExplorerContextValue({
        name: props.field.name,
        def: props.field,
      })}
    >
      <FieldDoc />
    </ExplorerContext.Provider>
  );
}

describe('FieldDoc', () => {
  it('should render a simple string field', () => {
    const { container } = render(
      <FieldDocWithContext field={exampleObject.getFields().string} />,
    );
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'No Description',
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.arg')).not.toBeInTheDocument();
  });

  it('should re-render on field change', () => {
    const { container, rerender } = render(
      <FieldDocWithContext field={exampleObject.getFields().string} />,
    );
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'No Description',
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.arg')).not.toBeInTheDocument();

    rerender(
      <FieldDocWithContext field={exampleObject.getFields().stringWithArgs} />,
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'Example String field with arguments',
    );
  });

  it('should render a string field with arguments', () => {
    const { container } = render(
      <FieldDocWithContext field={exampleObject.getFields().stringWithArgs} />,
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('.doc-type-description')).toHaveTextContent(
      'Example String field with arguments',
    );
    expect(container.querySelectorAll('.arg')).toHaveLength(1);
    expect(container.querySelector('.arg')).toHaveTextContent(
      'stringArg: String',
    );
    // by default, the deprecation docs should be hidden
    expect(container.querySelectorAll('.doc-deprecation')).toHaveLength(0);
    // make sure deprecation is present
    fireEvent.click(container.querySelector('.show-btn'));
    const deprecationDocs = container.querySelectorAll('.doc-deprecation');
    expect(deprecationDocs).toHaveLength(1);
    expect(deprecationDocs[0]).toHaveTextContent('no longer used');
  });

  it('should render a string field with directives', () => {
    const { container } = render(
      <FieldDocWithContext
        field={exampleObject.getFields().stringWithDirective}
      />,
    );
    expect(container.querySelector('.type-name')).toHaveTextContent('String');
    expect(container.querySelector('#development')).toHaveTextContent(
      '@development',
    );
  });
});
