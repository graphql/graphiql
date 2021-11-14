/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { readFileSync } from 'fs';
import {
  buildSchema,
  GraphQLSchema,
  GraphQLBoolean,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  parse,
} from 'graphql';

import { join } from 'path';
import { collectVariables } from '../collectVariables';

import { getVariablesJSONSchema } from '../getVariablesJSONSchema';

describe('getVariablesJSONSchema', () => {
  let schema: GraphQLSchema;

  beforeEach(() => {
    const schemaPath = join(__dirname, '__schema__', 'StarWarsSchema.graphql');
    schema = buildSchema(readFileSync(schemaPath, 'utf8'));
  });

  it('should handle scalar types', () => {
    const variableToType = collectVariables(
      schema,
      parse(`query($id: ID, $string: String!, $boolean: Boolean, $number: Int!, $price: Float) {
        characters{
          name
        }
       }`),
    );

    const jsonSchema = getVariablesJSONSchema(variableToType);

    expect(jsonSchema.required).toEqual(['string', 'number']);

    expect(jsonSchema.properties).toEqual({
      boolean: {
        type: 'boolean',
        description: GraphQLBoolean.description,
      },
      string: {
        type: 'string',
        description: GraphQLString.description,
      },
      number: {
        type: 'integer',
        description: GraphQLInt.description,
      },
      price: {
        description: GraphQLFloat.description,
        type: 'number',
      },
    });
  });

  it('should handle input object types', () => {
    const variableToType = collectVariables(
      schema,
      parse(`query($input: InputType!, $anotherInput: InputType) {
        characters {
          name
        }
       }`),
    );
    const inputTypeDefinition = {
      type: 'object',
      description: 'example input type',
      properties: {
        key: {
          type: 'string',
          description: GraphQLString.description,
        },
        value: {
          type: 'integer',
          description: GraphQLInt.description,
        },
      },
      required: ['key'],
    };

    const jsonSchema = getVariablesJSONSchema(variableToType);

    expect(jsonSchema.required).toEqual(['input']);

    expect(jsonSchema.properties).toEqual({
      input: inputTypeDefinition,
      anotherInput: inputTypeDefinition,
    });
  });
});
