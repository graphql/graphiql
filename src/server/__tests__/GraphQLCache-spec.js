/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import {expect} from 'chai';
import {describe, it} from 'mocha';

import {getGraphQLCache} from '../GraphQLCache';
import {GraphQLSchema} from 'graphql/type';
import {parse} from 'graphql/language';

describe('GraphQLCache', async () => {
  const cache = await getGraphQLCache(__dirname);
  const graphQLRC = cache.getGraphQLRC();
  const config = graphQLRC.getConfig('test');

  describe('getSchema', () => {
    it('generates the schema correctly', async () => {
      const schemaPath = config.getSchemaPath();
      const schema = await cache.getSchema(schemaPath);
      expect(schema instanceof GraphQLSchema).toEqual(true);
    });
  });

  describe('getFragmentDependencies', () => {
    it('finds fragments referenced from the query', async () => {
      const ast = parse('query A { ...Duck }');

      const duckContent = `fragment Duck on Duck {
        cuack
      }`;
      const duckDefinition = parse(duckContent).definitions[0];

      const catContent = `fragment Cat on Cat {
        meow
      }`;

      const catDefinition = parse(catContent).definitions[0];

      const fragmentDefinitions = new Map();
      fragmentDefinitions.set('Duck', {
        file: 'someFilePath',
        content: duckContent,
        definition: duckDefinition,
      });
      fragmentDefinitions.set('Cat', {
        file: 'someOtherFilePath',
        content: catContent,
        definition: catDefinition,
      });

      const result = await cache.getFragmentDependenciesForAST(
        ast,
        fragmentDefinitions,
      );
      expect(result.length).toEqual(1);
    });
  });
});
