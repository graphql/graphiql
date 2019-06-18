/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { join } from 'path';
import * as fs from 'fs';
import { buildSchema } from 'graphql';

import { GraphQLConfig } from 'graphql-config';
import { GraphQLLanguageService } from '../GraphQLLanguageService';

const MOCK_CONFIG = {
  schemaPath: './__schema__/StarWarsSchema.graphql',
  includes: ['./queries/**', '**/*.graphql'],
};

describe('GraphQLLanguageService', () => {
  const mockCache: any = {
    getSchema() {
      const schemaSDL = fs.readFileSync(
        join(__dirname, '__schema__/StarWarsSchema.graphql'),
        'utf8',
      );
      const schemaJS = buildSchema(schemaSDL);
      return new Promise((resolve, reject) => resolve(schemaJS));
    },

    getGraphQLConfig() {
      return new GraphQLConfig(MOCK_CONFIG, join(__dirname, '.graphqlconfig'));
    },

    getObjectTypeDefinitions() {
      return {
        Episode: {
          filePath: 'fake file path',
          content: 'fake file content',
          definition: {
            name: {
              value: 'Episode',
            },
            loc: {
              start: 293,
              end: 335,
            },
          },
        },
      };
    },

    getObjectTypeDependenciesForAST() {
      return [
        {
          filePath: 'fake file path',
          content: 'fake file content',
          definition: {
            name: {
              value: 'Episode',
            },
            loc: {
              start: 293,
              end: 335,
            },
          },
        },
      ];
    },
  };

  let languageService;
  beforeEach(() => {
    languageService = new GraphQLLanguageService(mockCache);
  });

  it('runs diagnostic service as expected', async () => {
    const diagnostics = await languageService.getDiagnostics(
      'qeury',
      './queries/testQuery.graphql',
    );
    expect(diagnostics.length).to.equal(1);
    const diagnostic = diagnostics[0];
    expect(diagnostic.message).to.equal(
      'Syntax Error: Unexpected Name "qeury"',
    );
  });

  it('runs definition service as expected', async () => {
    const definitionQueryResult = await languageService.getDefinition(
      'type Query { hero(episode: Episode): Character }',
      { line: 0, character: 28 },
      './queries/definitionQuery.graphql',
    );
    expect(definitionQueryResult.definitions.length).to.equal(1);
  });

  it('runs hover service as expected', async () => {
    const hoverInformation = await languageService.getHoverInformation(
      'type Query { hero(episode: String): String }',
      { line: 0, character: 28 },
      './queries/definitionQuery.graphql',
    );
    expect(hoverInformation).to.equal(
      'String\n\nThe `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
    );
  });
});
