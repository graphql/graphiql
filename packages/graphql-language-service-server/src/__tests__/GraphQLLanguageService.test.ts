/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { join } from 'node:path';

import { GraphQLConfig } from 'graphql-config';
import { GraphQLLanguageService } from '../GraphQLLanguageService';
import { SymbolKind } from 'vscode-languageserver-protocol';
import { Position } from 'graphql-language-service';
import { NoopLogger } from '../Logger';
import { GraphQLEnumType } from 'graphql';

const MOCK_CONFIG = {
  filepath: join(__dirname, '.graphqlrc.yml'),
  config: {
    schema: './__schema__/StarWarsSchema.graphql',
    documents: ['./queries/**', '**/*.graphql'],
  },
};

describe('GraphQLLanguageService', () => {
  const mockCache = {
    async getSchema() {
      const config = this.getGraphQLConfig();
      return config.getDefault().getSchema();
    },

    getGraphQLConfig() {
      return new GraphQLConfig(MOCK_CONFIG, []);
    },

    getProjectForFile(uri: string) {
      return this.getGraphQLConfig().getProjectForFile(uri);
    },
    getFragmentDefinitions() {
      const definitions = new Map();
      definitions.set('TestFragment', {
        filePath: 'fake file path',
        content: 'fake file content',
        definition: {
          kind: 'FragmentDefinition',
          name: {
            value: 'TestFragment',
          },
          loc: {
            start: 293,
            end: 335,
          },
        },
      });
      return definitions;
    },
    // setting the defs here in duplicate as with object types below
    // leads to duplicates, perhaps related to a bug, or perhaps just a test bug?
    getFragmentDependenciesForAST() {
      return [];
    },
    getObjectTypeDefinitions() {
      const definitions = new Map();

      definitions.set('Episode', {
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
      });

      definitions.set('Human', {
        filePath: 'fake file path',
        content: 'fake file content',
        definition: {
          name: {
            value: 'Human',
          },

          fields: [
            {
              name: { value: 'name' },
              loc: {
                start: 293,
                end: 335,
              },
              arguments: [
                {
                  name: { value: 'arg' },
                  loc: {
                    start: 293,
                    end: 335,
                  },
                  type: GraphQLEnumType,
                },
              ],
            },
          ],

          loc: {
            start: 293,
            end: 335,
          },
        },
      });

      return definitions;
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
        {
          filePath: 'fake file path',
          content: 'fake file content',
          definition: {
            name: {
              value: 'Human',
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
    languageService = new GraphQLLanguageService(
      mockCache as any,
      new NoopLogger(),
    );
  });

  it('runs diagnostic service as expected', async () => {
    const diagnostics = await languageService.getDiagnostics(
      'invalidKeyword',
      './queries/testQuery.graphql',
    );
    expect(diagnostics.length).toEqual(1);
    const diagnostic = diagnostics[0];
    expect(diagnostic.message).toEqual(
      'Syntax Error: Unexpected Name "invalidKeyword".',
    );
  });

  it('avoids reporting validation errors when not enough characters are present', async () => {
    const diagnostics = await languageService.getDiagnostics(
      ' \n   \n  \n\n',
      './queries/testQuery.graphql',
    );
    expect(diagnostics.length).toEqual(0);
  });

  it('still reports errors on empty anonymous op', async () => {
    const diagnostics = await languageService.getDiagnostics(
      ' \n   {\n  \n}\n\n',
      './queries/testQuery.graphql',
    );
    expect(diagnostics.length).toEqual(1);
    expect(diagnostics[0].message).toEqual(
      'Syntax Error: Expected Name, found "}".',
    );
  });

  it('runs definition service as expected', async () => {
    const definitionQueryResult = await languageService.getDefinition(
      'type Query { hero(episode: Episode): Character }',
      { line: 0, character: 28 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(definitionQueryResult?.definitions.length).toEqual(1);
  });

  it('runs definition service on fragment definition', async () => {
    const definitionQueryResult = await languageService.getDefinition(
      'fragment TestFragment on Human { name }',
      { line: 0, character: 14 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(definitionQueryResult?.definitions.length).toEqual(1);
  });
  it('runs definition service on fragment spread', async () => {
    const definitionQueryResult = await languageService.getDefinition(
      'fragment TestFragment on Human { name }\nquery { ...TestFragment }',
      { line: 1, character: 14 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(definitionQueryResult?.definitions.length).toEqual(1);
  });

  it('runs definition service on field as expected', async () => {
    const definitionQueryResult = await languageService.getDefinition(
      'query XXX { human { name } }',
      { line: 0, character: 21 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(definitionQueryResult?.definitions.length).toEqual(1);
  });

  it('can find a definition for a union', async () => {
    const query =
      'union X = A | B\ntype A { x: String }\ntype B { x: String }\ntype Query { a: X }';
    const definitionQueryResult = await languageService.getDefinition(
      query,
      { line: 3, character: 16 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(definitionQueryResult?.definitions.length).toEqual(1);
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
