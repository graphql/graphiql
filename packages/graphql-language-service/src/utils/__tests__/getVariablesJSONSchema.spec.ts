/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { readFileSync } from 'node:fs';
import { buildSchema, GraphQLSchema, parse } from 'graphql';

import { join } from 'node:path';
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
        description: 'Boolean',
      },
      string: {
        type: 'string',
        description: 'String!',
      },
      number: {
        type: 'integer',
        description: 'Int!',
      },
      price: {
        description: 'Float',
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

    const jsonSchema = getVariablesJSONSchema(variableToType);

    expect(jsonSchema.required).toEqual(['input']);

    expect(jsonSchema.properties).toEqual({
      input: {
        $ref: '#/definitions/InputType',
        description: 'InputType!',
      },
      anotherInput: {
        $ref: '#/definitions/InputType',
        description: 'example input type\nInputType',
      },
    });
    expect(jsonSchema.definitions).toEqual({
      InputType: {
        type: 'object',
        description: 'example input type\nInputType',
        properties: {
          key: {
            description: 'example key\nString!',
            type: 'string',
          },
          value: {
            description: 'example value\nInt',
            type: 'integer',
            default: 42,
          },
          exampleObject: {
            $ref: '#/definitions/ChildInputType',
            description: 'nesting a whole object!\nChildInputType!',
          },
          exampleList: {
            type: 'array',
            items: {
              $ref: '#/definitions/ChildInputType',
            },
            description: 'list type with default\n[ChildInputType]',
            default: [
              {
                isChild: false,
                favoriteBook: 'Binti',
              },
            ],
          },
          exampleScalarList: {
            type: 'array',
            description: '[String]!',
            items: {
              type: 'string',
              description: 'String',
            },
            default: ['something'],
          },
        },
        required: ['key', 'exampleObject', 'exampleScalarList'],
      },
      ChildInputType: {
        type: 'object',
        description: 'ChildInputType',
        properties: {
          isChild: {
            type: 'boolean',
            description: 'Boolean!',
            default: true,
          },
          favoriteBook: {
            type: 'string',
            description: 'favorite book\nString',
            default: 'Where the wild things are',
          },
        },
        required: ['isChild'],
      },
    });
  });

  const mdTicks = (name: string) => `\`\`\`graphql\n${name}\n\`\`\``;

  it('should handle input object types with markdown', () => {
    const variableToType = collectVariables(
      schema,
      parse(`query($input: InputType!, $anotherInput: InputType, $episode: Episode) {
        characters {
          name
        }
       }`),
    );

    const jsonSchema = getVariablesJSONSchema(variableToType, {
      useMarkdownDescription: true,
    });

    expect(jsonSchema.required).toEqual(['input']);

    expect(jsonSchema.properties).toEqual({
      input: {
        $ref: '#/definitions/InputType',
        description: 'InputType!',
        markdownDescription: mdTicks('InputType!'),
      },
      anotherInput: {
        $ref: '#/definitions/InputType',
        // description: 'example input type',
        // TODO: fix this for non-nulls?
        description: 'example input type\nInputType',
        markdownDescription: 'example input type\n```graphql\nInputType\n```',
      },
      episode: {
        enum: ['NEWHOPE', 'EMPIRE', 'JEDI'],
        description: 'Episode',
        type: 'string',
        markdownDescription: mdTicks('Episode'),
      },
    });
    expect(jsonSchema.definitions).toEqual({
      InputType: {
        type: 'object',
        description: 'example input type\nInputType',
        markdownDescription: `example input type\n${mdTicks('InputType')}`,
        properties: {
          key: {
            description: 'example key\nString!',
            markdownDescription: `example key\n${mdTicks('String!')}`,
            type: 'string',
          },
          value: {
            description: 'example value\nInt',
            markdownDescription: `example value\n${mdTicks('Int')}`,
            type: 'integer',
            default: 42,
          },
          exampleObject: {
            description: 'nesting a whole object!\nChildInputType!',
            markdownDescription: `nesting a whole object!\n${mdTicks(
              'ChildInputType!',
            )}`,
            $ref: '#/definitions/ChildInputType',
          },
          exampleList: {
            type: 'array',
            items: {
              $ref: '#/definitions/ChildInputType',
            },
            description: 'list type with default\n[ChildInputType]',
            markdownDescription: `list type with default\n${mdTicks(
              '[ChildInputType]',
            )}`,
            default: [
              {
                isChild: false,
                favoriteBook: 'Binti',
              },
            ],
          },
          exampleScalarList: {
            type: 'array',
            description: '[String]!',
            markdownDescription: mdTicks('[String]!'),
            items: {
              type: 'string',
              description: 'String',
              markdownDescription: mdTicks('String'),
            },
            default: ['something'],
          },
        },
        required: ['key', 'exampleObject', 'exampleScalarList'],
      },
      ChildInputType: {
        description: 'ChildInputType',
        markdownDescription: `${mdTicks('ChildInputType')}`,
        properties: {
          favoriteBook: {
            default: 'Where the wild things are',
            description: 'favorite book\nString',
            markdownDescription: 'favorite book\n```graphql\nString\n```',
            type: 'string',
          },
          isChild: {
            default: true,
            description: 'Boolean!',
            markdownDescription: '```graphql\nBoolean!\n```',
            type: 'boolean',
          },
        },
        required: ['isChild'],
        type: 'object',
      },
    });
  });

  it('should handle recursive schema properly', () => {
    const schemaPath = join(__dirname, '__schema__', 'RecursiveSchema.graphql');
    schema = buildSchema(readFileSync(schemaPath, 'utf8'));

    const variableToType = collectVariables(
      schema,
      parse(`query Example(
      $where: issues_where_input! = {}
    ) {
      issues(where: $where) {
        name
      }
    }`),
    );

    getVariablesJSONSchema(variableToType, { useMarkdownDescription: true });
    expect(true).toEqual(true);
  });
});
