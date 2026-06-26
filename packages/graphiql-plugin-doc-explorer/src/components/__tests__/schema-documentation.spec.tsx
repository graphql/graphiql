import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import { SchemaDocumentation } from '../schema-documentation';
import { VirtualList } from '../virtual-list';

vi.mock('../virtual-list', () => ({
  VirtualList: vi.fn(() => <div data-testid="mock-virtual-list" />),
}));

const VirtualListMock = vi.mocked(VirtualList);

function makeSchemaWithNTypes(typeCount: number): GraphQLSchema {
  const userTypes = Array.from(
    { length: typeCount },
    (_, i) =>
      new GraphQLObjectType({
        name: `UserType${i}`,
        fields: { name: { type: GraphQLString } },
      }),
  );
  const queryFields: GraphQLFieldConfigMap<unknown, unknown> = {};
  for (const [i, t] of userTypes.entries()) {
    queryFields[`field${i}`] = { type: t };
  }
  return new GraphQLSchema({
    query: new GraphQLObjectType({ name: 'Query', fields: queryFields }),
    types: userTypes,
  });
}

describe('SchemaDocumentation', () => {
  beforeEach(() => {
    VirtualListMock.mockClear();
  });

  it('renders VirtualList when there are more than 1000 types in allTypes', () => {
    const schema = makeSchemaWithNTypes(1500);
    render(<SchemaDocumentation schema={schema} />);

    expect(VirtualListMock).toHaveBeenCalledTimes(1);
    const items = VirtualListMock.mock.calls[0]![0].items as unknown[];
    expect(items.length).toBeGreaterThan(1000);
  });

  it('renders a plain list (not VirtualList) for small schemas', () => {
    const schema = makeSchemaWithNTypes(5);
    const { container } = render(<SchemaDocumentation schema={schema} />);

    expect(VirtualListMock).not.toHaveBeenCalled();
    // Every UserType plus the built-in String scalar should render a TypeLink.
    const typeLinks = container.querySelectorAll(
      '.graphiql-doc-explorer-section--all-types .graphiql-doc-explorer-type-name',
    );
    expect(typeLinks.length).toBeGreaterThanOrEqual(5);
  });
});
