/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { expect } from 'chai';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  parse,
} from 'graphql';

import { collectVariables } from '../getQueryFacts';

describe('collectVariables', () => {
  const TestType = new GraphQLObjectType({
    name: 'Test',
    fields: {
      id: { type: GraphQLID },
      string: { type: GraphQLString },
      int: { type: GraphQLInt },
      float: { type: GraphQLFloat },
      boolean: { type: GraphQLBoolean },
    },
  });

  const TestSchema = new GraphQLSchema({
    query: TestType,
  });

  it('returns an empty object if no variables exist', () => {
    const variableToType = collectVariables(TestSchema, parse('{ id }'));
    expect(variableToType).to.deep.equal({});
  });

  it('collects variable types from a schema and query', () => {
    const variableToType = collectVariables(
      TestSchema,
      parse(`
      query ($foo: Int, $bar: String) { id }
    `),
    );
    expect(Object.keys(variableToType)).to.deep.equal(['foo', 'bar']);
    expect(variableToType.foo).to.equal(GraphQLInt);
    expect(variableToType.bar).to.equal(GraphQLString);
  });

  it('collects variable types from multiple queries', () => {
    const variableToType = collectVariables(
      TestSchema,
      parse(`
      query A($foo: Int, $bar: String) { id }
      query B($foo: Int, $baz: Float) { id }
    `),
    );
    expect(Object.keys(variableToType)).to.deep.equal(['foo', 'bar', 'baz']);
    expect(variableToType.foo).to.equal(GraphQLInt);
    expect(variableToType.bar).to.equal(GraphQLString);
    expect(variableToType.baz).to.equal(GraphQLFloat);
  });
});
