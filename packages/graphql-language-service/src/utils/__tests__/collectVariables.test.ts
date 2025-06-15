/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLSchema,
  GraphQLString,
  parse,
  GraphQLEnumType,
  GraphQLObjectType,
} from 'graphql';

import { collectVariables } from '../collectVariables';

const TestEnum = new GraphQLEnumType({
  name: 'ExampleEnum',
  values: {
    a: { value: 'a' },
    b: { value: 'b' },
  },
});

describe('collectVariables', () => {
  const TestType = new GraphQLObjectType({
    name: 'Test',
    fields: {
      id: { type: GraphQLID },
      string: { type: GraphQLString },
      int: { type: GraphQLInt },
      float: { type: GraphQLFloat },
      boolean: { type: GraphQLBoolean },
      enum: { type: TestEnum },
    },
  });

  const TestSchema = new GraphQLSchema({
    query: TestType,
  });

  it('returns an empty object if no variables exist', () => {
    const variableToType = collectVariables(TestSchema, parse('{ id }'));
    expect(variableToType).toEqual({});
  });

  it('collects variable types from a schema and query', () => {
    const variableToType = collectVariables(
      TestSchema,
      parse(`
      query ($foo: Int, $bar: String) { id }
    `),
    );
    expect(Object.keys(variableToType)).toEqual(['foo', 'bar']);
    expect(variableToType.foo).toEqual(GraphQLInt);
    expect(variableToType.bar).toEqual(GraphQLString);
  });

  it('collects variable types from multiple queries', () => {
    const variableToType = collectVariables(
      TestSchema,
      parse(`
      query A($foo: Int, $bar: String) { id }
      query B($foo: Int, $baz: Float) { id },
      query B($foo: Int, $baz: Float, $bae: ExampleEnum) { id }
    `),
    );
    expect(Object.keys(variableToType)).toEqual(['foo', 'bar', 'baz', 'bae']);
    expect(variableToType.foo).toEqual(GraphQLInt);
    expect(variableToType.bar).toEqual(GraphQLString);
    expect(variableToType.baz).toEqual(GraphQLFloat);
    expect(variableToType.baz).toEqual(GraphQLFloat);
    expect(variableToType.bae).toEqual(TestEnum);
  });
});
