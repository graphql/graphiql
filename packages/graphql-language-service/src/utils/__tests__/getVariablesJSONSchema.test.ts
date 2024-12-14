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
      parse(`query(
          $id: ID,
          $string: String!,
          $boolean: Boolean,
          $number: Int!,
          $price: Float,
          $custom: SomeCustomScalar,
          $anotherCustom: SomeCustomScalar!
        ) {
        characters{
          name
        }
       }`),
    );

    const jsonSchema = getVariablesJSONSchema(variableToType);

    expect(jsonSchema.required).toEqual(['string', 'number', 'anotherCustom']);

    expect(jsonSchema.properties).toEqual({
      boolean: {
        type: ['boolean', 'null'],
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
        type: ['number', 'null'],
      },
      custom: {
        description: 'SomeCustomScalar',
        type: ['string', 'number', 'boolean', 'integer', 'null'],
      },
      anotherCustom: {
        description: 'SomeCustomScalar!',
        type: ['string', 'number', 'boolean', 'integer'],
      },
    });
  });

  it('should handle custom scalar schemas', () => {
    const variableToType = collectVariables(
      schema,
      parse(`query(
          $email: EmailAddress!,
          $optionalEmail: EmailAddress,
          $evenNumber: Even!,
          $optionalEvenNumber: Even,
          $special: SpecialScalar!,
          $optionalSpecial: SpecialScalar,
          $specialDate: SpecialDate!,
          $optionalSpecialDate: SpecialDate,
          $foobar: FooBar!,
          $optionalFoobar: FooBar,
          $foo: Foo!,
          $optionalFoo: Foo,
          $customInput: CustomScalarsInput!,
          $optionalCustomInput: CustomScalarsInput
        ) {
        characters{
          name
        }
       }`),
    );

    const jsonSchema = getVariablesJSONSchema(variableToType, {
      scalarSchemas: {
        EmailAddress: {
          type: 'string',
          format: 'email',
        },
        Even: {
          type: 'integer',
          multipleOf: 2,
          description: 'An even number.',
        },
        SpecialScalar: {
          type: ['string'],
          minLength: 5,
        },
        FooBar: {
          enum: ['foo', 'bar'],
        },
        Foo: {
          const: 'foo',
        },
        SpecialDate: {
          description: 'A date or date time.',
          oneOf: [
            {
              type: 'string',
              format: 'date-time',
            },
            {
              type: 'string',
              format: 'date',
            },
          ],
        },
      },
    });

    expect(jsonSchema.required).toEqual([
      'email',
      'evenNumber',
      'special',
      'specialDate',
      'foobar',
      'foo',
      'customInput',
    ]);

    expect(jsonSchema.definitions).toEqual({
      CustomScalarsInput: {
        description: 'CustomScalarsInput\nAn input type with custom scalars',
        properties: {
          email: {
            description: 'example email\n\nEmailAddress',
            format: 'email',
            type: ['string', 'null'],
          },
          even: {
            description: 'example even\n\nEven\nAn even number.',
            multipleOf: 2,
            type: ['integer', 'null'],
          },
        },
        required: [],
        type: 'object',
      },
    });

    expect(jsonSchema.properties).toEqual({
      email: {
        type: 'string',
        format: 'email',
        description: 'EmailAddress!',
      },
      optionalEmail: {
        type: ['string', 'null'],
        format: 'email',
        description: 'EmailAddress',
      },
      evenNumber: {
        type: 'integer',
        multipleOf: 2,
        description: 'Even!\nAn even number.',
      },
      optionalEvenNumber: {
        type: ['integer', 'null'],
        multipleOf: 2,
        description: 'Even\nAn even number.',
      },
      special: {
        type: ['string'],
        minLength: 5,
        description: 'SpecialScalar!',
      },
      optionalSpecial: {
        type: ['string', 'null'],
        minLength: 5,
        description: 'SpecialScalar',
      },
      foobar: {
        enum: ['foo', 'bar'],
        description: 'FooBar!',
      },
      optionalFoobar: {
        enum: ['foo', 'bar', null],
        description: 'FooBar',
      },
      foo: {
        const: 'foo',
        description: 'Foo!',
      },
      optionalFoo: {
        oneOf: [{ const: 'foo' }, { type: 'null' }],
        description: 'Foo',
      },
      specialDate: {
        description: 'SpecialDate!\nA date or date time.',
        oneOf: [
          {
            type: 'string',
            format: 'date-time',
          },
          {
            type: 'string',
            format: 'date',
          },
        ],
      },
      optionalSpecialDate: {
        description: 'SpecialDate\nA date or date time.',
        oneOf: [
          {
            type: 'string',
            format: 'date-time',
          },
          {
            type: 'string',
            format: 'date',
          },
          {
            type: 'null',
          },
        ],
      },
      customInput: {
        $ref: '#/definitions/CustomScalarsInput',
        description: 'CustomScalarsInput!\nAn input type with custom scalars',
      },
      optionalCustomInput: {
        description: 'CustomScalarsInput\nAn input type with custom scalars',
        oneOf: [
          {
            $ref: '#/definitions/CustomScalarsInput',
          },
          {
            type: 'null',
          },
        ],
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
        description: 'InputType!\nexample input type',
      },
      anotherInput: {
        oneOf: [{ $ref: '#/definitions/InputType' }, { type: 'null' }],
        description: 'InputType\nexample input type',
      },
    });
    expect(jsonSchema.definitions).toEqual({
      InputType: {
        type: 'object',
        description: 'InputType\nexample input type',
        properties: {
          key: {
            description: 'example key\n\nString!',
            type: 'string',
          },
          value: {
            description: 'example value\n\nInt',
            type: ['integer', 'null'],
            default: 42,
          },
          exampleObject: {
            $ref: '#/definitions/ChildInputType',
            description: 'nesting a whole object!\n\nChildInputType!',
          },
          exampleList: {
            type: ['array', 'null'],
            items: {
              description: 'ChildInputType',
              oneOf: [
                { $ref: '#/definitions/ChildInputType' },
                { type: 'null' },
              ],
            },
            description: 'list type with default\n\n[ChildInputType]',
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
              type: ['string', 'null'],
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
            type: ['string', 'null'],
            description: 'favorite book\n\nString',
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
      parse(`query($input: InputType!, $anotherInput: InputType, $episode: Episode, $anotherEpisode: Episode!) {
        characters {
          name
        }
       }`),
    );

    const jsonSchema = getVariablesJSONSchema(variableToType, {
      useMarkdownDescription: true,
    });

    expect(jsonSchema.required).toEqual(['input', 'anotherEpisode']);

    expect(jsonSchema.properties).toEqual({
      input: {
        $ref: '#/definitions/InputType',
        description: 'InputType!\nexample input type',
        markdownDescription: '```graphql\nInputType!\n```\nexample input type',
      },
      anotherInput: {
        oneOf: [{ $ref: '#/definitions/InputType' }, { type: 'null' }],
        description: 'InputType\nexample input type',
        markdownDescription: '```graphql\nInputType\n```\nexample input type',
      },
      episode: {
        enum: ['NEWHOPE', 'EMPIRE', 'JEDI', null],
        description: 'Episode',
        markdownDescription: mdTicks('Episode'),
      },
      anotherEpisode: {
        enum: ['NEWHOPE', 'EMPIRE', 'JEDI'],
        description: 'Episode!',
        markdownDescription: mdTicks('Episode!'),
      },
    });
    expect(jsonSchema.definitions).toEqual({
      InputType: {
        type: 'object',
        description: 'InputType\nexample input type',
        markdownDescription: `${mdTicks('InputType')}\nexample input type`,
        properties: {
          key: {
            description: 'example key\n\nString!',
            markdownDescription: `example key\n\n${mdTicks('String!')}`,
            type: 'string',
          },
          value: {
            description: 'example value\n\nInt',
            markdownDescription: `example value\n\n${mdTicks('Int')}`,
            type: ['integer', 'null'],
            default: 42,
          },
          exampleObject: {
            description: 'nesting a whole object!\n\nChildInputType!',
            markdownDescription: `nesting a whole object!\n\n${mdTicks(
              'ChildInputType!',
            )}`,
            $ref: '#/definitions/ChildInputType',
          },
          exampleList: {
            type: ['array', 'null'],
            items: {
              description: 'ChildInputType',
              markdownDescription: '```graphql\nChildInputType\n```',
              oneOf: [
                { $ref: '#/definitions/ChildInputType' },
                { type: 'null' },
              ],
            },
            description: 'list type with default\n\n[ChildInputType]',
            markdownDescription: `list type with default\n\n${mdTicks(
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
              type: ['string', 'null'],
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
            description: 'favorite book\n\nString',
            markdownDescription: 'favorite book\n\n```graphql\nString\n```',
            type: ['string', 'null'],
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
