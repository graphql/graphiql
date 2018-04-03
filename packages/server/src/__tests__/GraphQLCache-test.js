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
import {getGraphQLConfig} from 'graphql-config';
import {beforeEach, describe, it} from 'mocha';

import {GraphQLCache} from '../GraphQLCache';
import {getQueryAndRange} from '../MessageProcessor';

function wihtoutASTNode(definition: object) {
  const result = {...definition};
  delete result.astNode;
  return result;
}

describe('GraphQLCache', () => {
  let cache;

  beforeEach(async () => {
    const configDir = __dirname;
    const graphQLRC = getGraphQLConfig(configDir);
    cache = new GraphQLCache(configDir, graphQLRC);
  });

  describe('getSchema', () => {
    it('generates the schema correctly for the test app config', async () => {
      const schema = await cache.getSchema('testWithSchema');
      expect(schema instanceof GraphQLSchema).to.equal(true);
    });

    it('does not generate a schema without a schema path', async () => {
      const schema = await cache.getSchema('testWithoutSchema');
      expect(schema instanceof GraphQLSchema).to.equal(false);
    });

    it('extend the schema with appropriate custom directive', async () => {
      const schema = await cache.getSchema('testWithCustomDirectives');
      expect(
        wihtoutASTNode(schema.getDirective('customDirective')),
      ).to.deep.equal({
        args: [],
        description: undefined,
        locations: ['FIELD'],
        name: 'customDirective',
      });
    });

    it('extend the schema with appropriate custom directive 2', async () => {
      const schema = await cache.getSchema('testWithSchema');
      expect(
        wihtoutASTNode(schema.getDirective('customDirective')),
      ).to.deep.equal({
        args: [],
        description: undefined,
        locations: ['FRAGMENT_SPREAD'],
        name: 'customDirective',
      });
    });
  });

  describe('getFragmentDependencies', () => {
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

    it('finds fragments referenced in Relay queries', async () => {
      const text =
        'module.exports = Relay.createContainer(' +
        'DispatchResumeCard, {\n' +
        '  fragments: {\n' +
        '    candidate: () => graphql`\n' +
        '      query A { ...Duck ...Cat }\n' +
        '    `,\n' +
        '  },\n' +
        '});';
      const contents = getQueryAndRange(text, 'test.js');
      const result = await cache.getFragmentDependenciesForAST(
        parse(contents[0].query),
        fragmentDefinitions,
      );
      expect(result.length).to.equal(2);
    });

    it('finds fragments referenced from the query', async () => {
      const ast = parse('query A { ...Duck }');

      const result = await cache.getFragmentDependenciesForAST(
        ast,
        fragmentDefinitions,
      );
      expect(result.length).to.equal(1);
    });
  });
});
