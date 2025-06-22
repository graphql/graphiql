import { FC, useEffect } from 'react';
import { fireEvent, render } from '@testing-library/react';
import type { GraphQLNamedType } from 'graphql';
import {
  ExampleSchema,
  ExampleEnum,
  ExampleUnion,
  ExampleQuery,
} from './fixtures';
import { docExplorerStore } from '../../context';
import { TypeDocumentation } from '../type-documentation';
import { unwrapType } from './test-utils';
import type { SlicesWithActions } from '@graphiql/react';

vi.mock('@graphiql/react', async () => {
  const originalModule =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  const useGraphiQL: (typeof originalModule)['useGraphiQL'] = cb =>
    cb({ schema: ExampleSchema } as SlicesWithActions);

  return {
    ...originalModule,
    useGraphiQL,
  };
});

const TypeDocumentationWithContext: FC<{ type: GraphQLNamedType }> = ({
  type,
}) => {
  useEffect(() => {
    docExplorerStore.setState({
      explorerNavStack: [
        {
          name: unwrapType(type).name,
          def: type,
        },
      ],
    });
  }, [type]);
  return <TypeDocumentation type={type} />;
};

describe('TypeDocumentation', () => {
  it('renders a top-level query object type', () => {
    const { container } = render(
      <TypeDocumentationWithContext type={ExampleQuery} />,
    );
    const description = container.querySelectorAll(
      '.graphiql-markdown-description',
    );
    expect(description).toHaveLength(1);
    expect(description[0]).toHaveTextContent('Query description\nSecond line', {
      normalizeWhitespace: false,
    });

    const cats = container.querySelectorAll('.graphiql-doc-explorer-item');
    expect(cats[0]).toHaveTextContent('string: String');
    expect(cats[1]).toHaveTextContent('union: exampleUnion');
    expect(cats[2]).toHaveTextContent(
      'fieldWithArgs(stringArg: String): String',
    );
  });

  it('renders deprecated fields when you click to see them', () => {
    const { container, getByText } = render(
      <TypeDocumentationWithContext type={ExampleQuery} />,
    );
    let cats = container.querySelectorAll('.graphiql-doc-explorer-item');
    expect(cats).toHaveLength(3);

    fireEvent.click(getByText('Show Deprecated Fields'));

    cats = container.querySelectorAll('.graphiql-doc-explorer-item');
    expect(cats).toHaveLength(4);
    expect(
      container.querySelectorAll('.graphiql-doc-explorer-field-name')[3],
    ).toHaveTextContent('deprecatedField');
    expect(
      container.querySelector('.graphiql-markdown-deprecation'),
    ).toHaveTextContent('example deprecation reason');
  });

  it('renders a Union type', () => {
    const { container } = render(
      <TypeDocumentationWithContext type={ExampleUnion} />,
    );
    const title = container.querySelector(
      '.graphiql-doc-explorer-section-title',
    )!;
    title.childNodes[0]!.remove();
    expect(title).toHaveTextContent('Possible Types');
  });

  it('renders an Enum type', () => {
    const { container } = render(
      <TypeDocumentationWithContext type={ExampleEnum} />,
    );
    const title = container.querySelector(
      '.graphiql-doc-explorer-section-title',
    )!;
    title.childNodes[0]!.remove();
    expect(title).toHaveTextContent('Enum Values');
    const enums = container.querySelectorAll(
      '.graphiql-doc-explorer-enum-value',
    );
    expect(enums[0]).toHaveTextContent('value1');
    expect(enums[1]).toHaveTextContent('value2');
  });

  it('shows deprecated enum values on click', () => {
    const { getByText, container } = render(
      <TypeDocumentationWithContext type={ExampleEnum} />,
    );
    const showBtn = getByText('Show Deprecated Values');
    expect(showBtn).toBeInTheDocument();

    const title = container.querySelector(
      '.graphiql-doc-explorer-section-title',
    )!;
    title.childNodes[0]!.remove();
    expect(title).toHaveTextContent('Enum Values');

    let enums = container.querySelectorAll('.graphiql-doc-explorer-enum-value');
    expect(enums).toHaveLength(2);

    // click button to show deprecated enum values
    fireEvent.click(showBtn);
    expect(showBtn).not.toBeInTheDocument();

    const deprecatedTitle = container.querySelectorAll(
      '.graphiql-doc-explorer-section-title',
    )[1]!;
    deprecatedTitle.childNodes[0]!.remove();
    expect(deprecatedTitle).toHaveTextContent('Deprecated Enum Values');

    enums = container.querySelectorAll('.graphiql-doc-explorer-enum-value');
    expect(enums).toHaveLength(3);
    expect(enums[2]).toHaveTextContent('value3');
    expect(
      container.querySelector('.graphiql-markdown-deprecation'),
    ).toHaveTextContent('Only two are needed');
  });
});
