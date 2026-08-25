import { buildSchema, GraphQLInputObjectType } from 'graphql';
import { describe, expect, it } from 'vitest';
import { Position } from '../../utils';
import { getContextAtPosition } from '../api';

describe('getTypeInfo', () => {
  it('retains the input object type that owns an object field', () => {
    const schema = buildSchema(`
      input LineItemInput {
        quantity: String
      }

      input OrderInput {
        lineItem: LineItemInput
      }

      type Mutation {
        submit(order: OrderInput): String
      }

      type Query {
        unused: String
      }
    `);
    const query = 'mutation { submit(order: { lineItem: { quantity: "1" } }) }';
    const context = getContextAtPosition(
      query,
      new Position(0, query.indexOf('quantity')),
      schema,
    );
    const lineItemInput = schema.getType(
      'LineItemInput',
    ) as GraphQLInputObjectType;

    expect(context?.typeInfo.inputObjectType).toBe(lineItemInput);
    expect(context?.typeInfo.fieldDef).toBe(lineItemInput.getFields().quantity);
  });
});
