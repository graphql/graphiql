import { fireEvent, render } from '@testing-library/react';
import { GraphQLString, GraphQLObjectType, Kind } from 'graphql';

import { ExplorerContext, ExplorerFieldDef } from '../../context';
import { FieldDocumentation } from '../field-documentation';
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

function FieldDocumentationWithContext(props: { field: ExplorerFieldDef }) {
  return (
    <ExplorerContext.Provider
      value={mockExplorerContextValue({
        name: props.field.name,
        def: props.field,
      })}
    >
      <FieldDocumentation field={props.field} />
    </ExplorerContext.Provider>
  );
}

describe('FieldDocumentation', () => {
  it('should render a simple string field', () => {
    const { container } = render(
      <FieldDocumentationWithContext
        field={exampleObject.getFields().string}
      />,
    );
    expect(
      container.querySelector('.graphiql-markdown-description'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('.graphiql-doc-explorer-type-name'),
    ).toHaveTextContent('String');
    expect(
      container.querySelector('.graphiql-doc-explorer-argument'),
    ).not.toBeInTheDocument();
  });

  it('should re-render on field change', () => {
    const { container, rerender } = render(
      <FieldDocumentationWithContext
        field={exampleObject.getFields().string}
      />,
    );
    expect(
      container.querySelector('.graphiql-markdown-description'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('.graphiql-doc-explorer-type-name'),
    ).toHaveTextContent('String');
    expect(
      container.querySelector('.graphiql-doc-explorer-argument'),
    ).not.toBeInTheDocument();

    rerender(
      <FieldDocumentationWithContext
        field={exampleObject.getFields().stringWithArgs}
      />,
    );
    expect(
      container.querySelector('.graphiql-doc-explorer-type-name'),
    ).toHaveTextContent('String');
    expect(
      container.querySelector('.graphiql-markdown-description'),
    ).toHaveTextContent('Example String field with arguments');
  });

  it('should render a string field with arguments', () => {
    const { container, getByText } = render(
      <FieldDocumentationWithContext
        field={exampleObject.getFields().stringWithArgs}
      />,
    );
    expect(
      container.querySelector('.graphiql-doc-explorer-type-name'),
    ).toHaveTextContent('String');
    expect(
      container.querySelector('.graphiql-markdown-description'),
    ).toHaveTextContent('Example String field with arguments');
    expect(
      container.querySelectorAll('.graphiql-doc-explorer-argument'),
    ).toHaveLength(1);
    expect(
      container.querySelector('.graphiql-doc-explorer-argument'),
    ).toHaveTextContent('stringArg: String');
    // by default, the deprecation docs should be hidden
    expect(
      container.querySelectorAll('.graphiql-markdown-deprecation'),
    ).toHaveLength(0);
    // make sure deprecation is present
    fireEvent.click(getByText('Show Deprecated Arguments'));
    const deprecationDocs = container.querySelectorAll(
      '.graphiql-markdown-deprecation',
    );
    expect(deprecationDocs).toHaveLength(1);
    expect(deprecationDocs[0]).toHaveTextContent('no longer used');
  });

  it('should render a string field with directives', () => {
    const { container } = render(
      <FieldDocumentationWithContext
        field={exampleObject.getFields().stringWithDirective}
      />,
    );
    expect(
      container.querySelector('.graphiql-doc-explorer-type-name'),
    ).toHaveTextContent('String');
    expect(
      container.querySelector('.graphiql-doc-explorer-directive'),
    ).toHaveTextContent('@development');
  });
});
