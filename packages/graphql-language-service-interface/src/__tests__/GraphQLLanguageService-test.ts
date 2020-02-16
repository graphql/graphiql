/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { join } from 'path';
import * as fs from 'fs';
import { buildSchema } from 'graphql';

import { GraphQLConfig } from 'graphql-config';
import { GraphQLLanguageService } from '../GraphQLLanguageService';
import { SymbolKind } from 'vscode-languageserver-protocol';
import { Position } from 'graphql-language-service-utils';

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
      return new Promise((resolve, _reject) => resolve(schemaJS));
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

  let languageService: GraphQLLanguageService;
  beforeEach(() => {
    languageService = new GraphQLLanguageService(mockCache);
  });

  it('runs diagnostic service as expected', async () => {
    const diagnostics = await languageService.getDiagnostics(
      'qeury',
      './queries/testQuery.graphql',
    );
    expect(diagnostics.length).toEqual(1);
    const diagnostic = diagnostics[0];
    expect(diagnostic.message).toEqual('Syntax Error: Unexpected Name "qeury"');
  });

  it('runs definition service as expected', async () => {
    const definitionQueryResult = await languageService.getDefinition(
      'type Query { hero(episode: Episode): Character }',
      { line: 0, character: 28 } as Position,
      './queries/definitionQuery.graphql',
    );
    // @ts-ignore
    expect(definitionQueryResult.definitions.length).toEqual(1);
  });

  it('runs hover service as expected', async () => {
    const hoverInformation = await languageService.getHoverInformation(
      'type Query { hero(episode: String): String }',
      { line: 0, character: 28 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(hoverInformation).toEqual(
      'String\n\nThe `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
    );
  });

  it('runs document symbol requests as expected', async () => {
    const validQuery = `
  query OperationExample {
    item(episode: EMPIRE){
      ...testFragment
    }
  }
  `;

    const result = await languageService.getDocumentSymbols(
      validQuery,
      'file://file.graphql',
    );

    expect(result).not.toBeUndefined();
    expect(result.length).toEqual(3);
    // expect(result[0].name).toEqual('item');
    expect(result[1].name).toEqual('item');
    expect(result[1].kind).toEqual(SymbolKind.Field);
    expect(result[1].location.range.start.line).toEqual(2);
    expect(result[1].location.range.start.character).toEqual(4);
    expect(result[1].location.range.end.line).toEqual(4);
    expect(result[1].location.range.end.character).toEqual(5);
  });
});
