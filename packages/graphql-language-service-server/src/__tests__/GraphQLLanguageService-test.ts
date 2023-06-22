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
import { parse } from 'graphql';

const simplify = (data: unknown) => JSON.parse(JSON.stringify(data));

const MOCK_CONFIG = {
  filepath: join(__dirname, '.graphqlrc.yml'),
  config: {
    schema: './__schema__/StarWarsSchema.graphql',
    documents: ['./queries/**', '**/*.graphql'],
  },
};

describe('GraphQLLanguageService', () => {
  let mockGetSchemaDocumentNode;

  const mockCache = {
    async getSchema() {
      const config = this.getGraphQLConfig();
      return config.getDefault()!.getSchema();
    },

    getGraphQLConfig() {
      return new GraphQLConfig(MOCK_CONFIG, []);
    },

    getProjectForFile(uri: string) {
      return this.getGraphQLConfig().getProjectForFile(uri);
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

    getSchemaDocumentNode() {
      return mockGetSchemaDocumentNode;
    },
  };

  let languageService: GraphQLLanguageService;
  beforeEach(() => {
    languageService = new GraphQLLanguageService(
      mockCache as any,
      new NoopLogger(),
    );
    mockGetSchemaDocumentNode = languageService._graphQLConfig.project;
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

  it('can find references for an object type', async () => {
    const document =
      'union X = A | B\ntype A { x: String }\ntype B { x: String }\ntype Query { a: X\n z: A }';
    mockGetSchemaDocumentNode = parse(document);

    const references = await languageService.getReferences(
      document,
      { line: 1, character: 5 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(
      references
        ?.flatMap(r => [r.location.range.start, r.location.range.end])
        .map(p => [p.line, p.character]),
    ).toEqual([
      [0, 10],
      [0, 10],
      [4, 4],
      [4, 4],
    ]);
  });

  it('can find references for fragments', async () => {
    const document =
      'fragment Example on Character {name}\nquery A { hero {...Example}}\nquery B { hero {...Example }}';

    mockGetSchemaDocumentNode = parse(document);

    const references = await languageService.getReferences(
      document,
      { line: 0, character: 12 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(
      references
        ?.flatMap(r => [r.location.range.start, r.location.range.end])
        .map(p => [p.line, p.character]),
    ).toEqual([
      [1, 16],
      [1, 19],
      [2, 16],
      [2, 19],
    ]);
  });

  it('finds no references', async () => {
    const document =
      'fragment ExampleA on Character {name}\nquery A { hero {...Example}}\nquery B { hero {...Example }}';

    mockGetSchemaDocumentNode = parse(document);

    const references = await languageService.getReferences(
      document,
      { line: 0, character: 12 } as Position,
      './queries/definitionQuery.graphql',
    );
    expect(
      references
        ?.flatMap(r => [r.location.range.start, r.location.range.end])
        .map(p => [p.line, p.character]),
    ).toEqual([]);
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
    expect(simplify(result)).toEqual(
      simplify([
        {
          containerName: undefined,
          name: 'OperationExample',
          kind: SymbolKind.Class,
          location: {
            range: {
              end: new Position(5, 3),
              start: new Position(1, 2),
            },
            uri: 'file://file.graphql',
          },
        },
        {
          containerName: 'OperationExample',
          name: 'item',
          kind: SymbolKind.Field,
          location: {
            range: {
              end: new Position(4, 5),
              start: new Position(2, 4),
            },
            uri: 'file://file.graphql',
          },
        },
        {
          containerName: 'item',
          name: 'testFragment',
          kind: SymbolKind.Struct,
          location: {
            range: {
              end: new Position(3, 21),
              start: new Position(3, 6),
            },
            uri: 'file://file.graphql',
          },
        },
      ]),
    );
  });
});
