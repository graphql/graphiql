import { describe, expect, it } from 'vitest';
import { GraphQLInputObjectType, GraphQLString } from 'graphql';
import { getSchemaReference } from './schema-reference';

describe('getSchemaReference', () => {
  it('resolves an object field under its owning input object type', () => {
    const lineItemInput = new GraphQLInputObjectType({
      name: 'LineItemInput',
      fields: {
        quantity: { type: GraphQLString },
      },
    });
    const quantityField = lineItemInput.getFields().quantity;

    const reference = getSchemaReference('ObjectField', {
      fieldDef: quantityField,
      inputObjectType: lineItemInput,
    });

    expect(reference).toMatchObject({
      kind: 'Field',
      field: quantityField,
      type: lineItemInput,
    });
  });
});
