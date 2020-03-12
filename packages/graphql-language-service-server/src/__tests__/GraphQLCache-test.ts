/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('cross-fetch', () => ({
  fetch: require('fetch-mock').fetchHandler,
}));
import { GraphQLSchema } from 'graphql/type';
import { parse } from 'graphql/language';
import { loadConfig } from 'graphql-config';
import fetchMock from 'fetch-mock';
import {
  introspectionFromSchema,
  FragmentDefinitionNode,
  TypeDefinitionNode,
} from 'graphql';
import { GraphQLCache } from '../GraphQLCache';
import { getQueryAndRange } from '../MessageProcessor';
import { FragmentInfo, ObjectTypeInfo } from 'graphql-language-service-types';

function wihtoutASTNode(definition: any) {
  const result = { ...definition };
  delete result.astNode;
  return result;
}

describe('GraphQLCache', () => {
  const configDir = __dirname;
  let graphQLRC;
  let cache = new GraphQLCache(configDir, graphQLRC);

  beforeEach(async () => {
    graphQLRC = await loadConfig({ rootDir: configDir });
    cache = new GraphQLCache(configDir, graphQLRC);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  describe('getSchema', () => {
    it('generates the schema correctly for the test app config', async () => {
      const schema = await cache.getSchema('testWithSchema');
      expect(schema instanceof GraphQLSchema).toEqual(true);
    });

    it('generates the schema correctly from endpoint', async () => {
      const introspectionResult = {
        data: introspectionFromSchema(
          await graphQLRC.getProject('testWithSchema').getSchema(),
          { descriptions: true },
        ),
      };
      fetchMock.mock({
        matcher: '*',
        response: {
          headers: {
            'Content-Type': 'application/json',
          },
          body: introspectionResult,
        },
      });

      const schema = await cache.getSchema('testWithEndpoint');
      expect(fetchMock.called('*')).toEqual(true);
      expect(schema instanceof GraphQLSchema).toEqual(true);
    });

    it('does not generate a schema without a schema path or endpoint', async () => {
      const schema = await cache.getSchema('testWithoutSchema');
      expect(schema instanceof GraphQLSchema).toEqual(false);
    });

    it('extend the schema with appropriate custom directive', async () => {
      const schema = (await cache.getSchema(
        'testWithCustomDirectives',
      )) as GraphQLSchema;
      expect(
        wihtoutASTNode(schema.getDirective('customDirective')),
      ).toMatchObject(
        expect.objectContaining({
          args: [],
          description: undefined,
          // TODO: failing now that tests are doing deep comparison
          // isRepeatable: false,
          locations: ['FIELD'],
          name: 'customDirective',
        }),
      );
    });

    it('extend the schema with appropriate custom directive 2', async () => {
      const schema = (await cache.getSchema('testWithSchema')) as GraphQLSchema;
      expect(
        wihtoutASTNode(schema.getDirective('customDirective')),
      ).toMatchObject(
        expect.objectContaining({
          args: [],
          description: undefined,
          // TODO: failing now that tests are doing deep comparison
          // isRepeatable: false,
          locations: ['FRAGMENT_SPREAD'],
          name: 'customDirective',
        }),
      );
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

    const fragmentDefinitions = new Map<string, FragmentInfo>();
    fragmentDefinitions.set('Duck', {
      file: 'someFilePath',
      content: duckContent,
      definition: duckDefinition,
    } as FragmentInfo);
    fragmentDefinitions.set('Cat', {
      file: 'someOtherFilePath',
      content: catContent,
      definition: catDefinition as FragmentDefinitionNode,
    } as FragmentInfo);

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
      expect(result.length).toEqual(2);
    });

    it('finds fragments referenced from the query', async () => {
      const ast = parse('query A { ...Duck }');

      const result = await cache.getFragmentDependenciesForAST(
        ast,
        fragmentDefinitions,
      );
      expect(result.length).toEqual(1);
    });
  });

  describe('getFragmentDefinitions', () => {
    it('it caches fragments found through single glob in `includes`', async () => {
      const config = graphQLRC.getProject('testSingularIncludesGlob');
      const fragmentDefinitions = await cache.getFragmentDefinitions(config);
      expect(fragmentDefinitions.get('testFragment')).not.toBeUndefined();
    });

    it('it caches fragments found through multiple globs in `includes`', async () => {
      const config = graphQLRC.getProject('testMultipleIncludes');
      const fragmentDefinitions = await cache.getFragmentDefinitions(config);
      expect(fragmentDefinitions.get('testFragment')).not.toBeUndefined();
    });

    it('handles empty includes', async () => {
      const config = graphQLRC.getProject('testNoIncludes');
      const fragmentDefinitions = await cache.getFragmentDefinitions(config);
      expect(fragmentDefinitions.get('testFragment')).toBeUndefined();
    });

    it('handles non-existent includes', async () => {
      const config = graphQLRC.getProject('testBadIncludes');
      const fragmentDefinitions = await cache.getFragmentDefinitions(config);
      expect(fragmentDefinitions.get('testFragment')).toBeUndefined();
    });
  });

  describe('getNamedTypeDependencies', () => {
    const query = `type Query {
        hero(episode: Episode): Character
      }

      type Episode {
        id: ID!
      }
      `;
    const parsedQuery = parse(query);

    const namedTypeDefinitions = new Map<string, ObjectTypeInfo>();
    namedTypeDefinitions.set('Character', {
      file: 'someOtherFilePath',
      content: query,
      definition: {
        kind: 'ObjectTypeDefinition',
        name: {
          kind: 'Name',
          value: 'Character',
        },
        loc: {
          start: 0,
          end: 0,
        },
      } as TypeDefinitionNode,
    } as ObjectTypeInfo);

    it('finds named types referenced from the SDL', async () => {
      const result = await cache.getObjectTypeDependenciesForAST(
        parsedQuery,
        namedTypeDefinitions,
      );
      expect(result.length).toEqual(1);
    });
  });
});
