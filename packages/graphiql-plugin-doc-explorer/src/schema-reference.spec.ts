import { describe, expect, it } from 'vitest';
import {
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { getSchemaReference } from './schema-reference';

describe('getSchemaReference', () => {
  it('resolves an object field under its owning input object type', () => {
    const lineItemInput = new GraphQLInputObjectType({
      name: 'LineItemInput',
      fields: {
        quantity: { type: GraphQLString },
      },
    });
    const orderInput = new GraphQLInputObjectType({
      name: 'OrderInput',
      fields: {
        lineItem: { type: lineItemInput },
      },
    });
    const mutationType = new GraphQLObjectType({
      name: 'Mutation',
      fields: {
        submit: {
          type: GraphQLString,
          args: {
            order: { type: orderInput },
          },
        },
      },
    });
    const schema = new GraphQLSchema({ mutation: mutationType });
    const quantityField = lineItemInput.getFields().quantity;

    const reference = getSchemaReference(
      'ObjectField',
      {
        fieldDef: quantityField,
        parentType: mutationType,
      },
      schema,
    );

    expect(reference).toMatchObject({
      kind: 'Field',
      field: quantityField,
      type: lineItemInput,
    });
  });
});
