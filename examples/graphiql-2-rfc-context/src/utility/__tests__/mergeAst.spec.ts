/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import {
  parse,
  print,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
} from 'graphql';

import mergeAst from '../mergeAst';

import { fixtures } from './mergeAst-fixture';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Test',
    fields: {
      id: {
        type: GraphQLInt,
      },
    },
  }),
});

describe('MergeAst', () => {
  fixtures.forEach(fixture => {
    it(`${fixture.desc}`, () => {
      const result = print(mergeAst(parse(fixture.query))).replace(/\s/g, '');
      const result2 = print(mergeAst(parse(fixture.query), schema)).replace(
        /\s/g,
        '',
      );
      expect(result).toEqual(fixture.mergedQuery.replace(/\s/g, ''));
      expect(result2).toEqual(fixture.mergedQueryWithSchema.replace(/\s/g, ''));
    });
  });
});
