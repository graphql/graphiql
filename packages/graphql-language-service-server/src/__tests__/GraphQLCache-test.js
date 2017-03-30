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
import {GraphQLSchema} from 'graphql/type';
import {parse} from 'graphql/language';
import {getGraphQLConfig} from 'graphql-language-service-config';
import {beforeEach, describe, it} from 'mocha';
import {join} from 'path';

import {GraphQLCache} from '../GraphQLCache';
import MockWatchmanClient from '../__mocks__/MockWatchmanClient';

describe('GraphQLCache', () => {
  let cache;
  let config;

  beforeEach(async () => {
    const watchmanClient = new MockWatchmanClient();
    const configDir = __dirname;
    const graphQLRC = await getGraphQLConfig(configDir);
    cache = new GraphQLCache(configDir, graphQLRC, watchmanClient);
    config = cache.getGraphQLConfig();
  });

  describe('getSchema', () => {
    it('generates the schema correctly for the test app config', async () => {
      const schemaPath = config.getSchemaPath('testWithSchema');
      const schema = await cache.getSchema(schemaPath);
      expect(schema instanceof GraphQLSchema).to.equal(true);
    });

    it('does not generate a schema without a schema path', async () => {
      const schemaPath = config.getSchemaPath('testWithoutSchema');
      const schema = await cache.getSchema(schemaPath);
      expect(schema instanceof GraphQLSchema).to.equal(false);
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
      expect(result.length).to.equal(1);
    });
  });
});
