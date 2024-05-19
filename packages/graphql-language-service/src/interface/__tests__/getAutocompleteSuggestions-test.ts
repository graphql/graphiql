/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  AutocompleteSuggestionOptions,
  CompletionItem,
} from 'graphql-language-service';

import fs from 'node:fs';
import {
  buildSchema,
  FragmentDefinitionNode,
  GraphQLSchema,
  parse,
  version as graphQLVersion,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLDeprecatedDirective,
  GraphQLSkipDirective,
  GraphQLIncludeDirective,
} from 'graphql';
import { Position } from '../../utils';
import path from 'node:path';

import { getAutocompleteSuggestions } from '../getAutocompleteSuggestions';
// import { InsertTextFormat } from 'vscode-languageserver-types';

const expectedResults = {
  droid: {
    label: 'droid',
    detail: 'Droid',
  },
  hero: {
    label: 'hero',
    detail: 'Character',
  },
  human: {
    label: 'human',
    detail: 'Human',
  },
  inputTypeTest: {
    label: 'inputTypeTest',
    detail: 'TestType',
  },
  appearsIn: {
    label: 'appearsIn',
    detail: '[Episode]',
  },
  friends: {
    label: 'friends',
    detail: '[Character]',
  },
  union: {
    label: 'union',
    detail: 'TestUnion',
  },
  __typename: {
    label: '__typename',
    detail: 'String!',
    documentation: 'The name of the current Object type at runtime.',
  },
};

const suggestionCommand = {
  command: 'editor.action.triggerSuggest',
  title: 'Suggestions',
};

describe('getAutocompleteSuggestions', () => {
  let schema: GraphQLSchema;
  beforeEach(async () => {
    // graphQLVersion = pkg.version;
    const schemaIDL = fs.readFileSync(
      path.join(__dirname, '__schema__/StarWarsSchema.graphql'),
      'utf8',
    );

    schema = buildSchema(schemaIDL);
  });

  // Returns a sorted autocomplete suggestions in an increasing order.
  function testSuggestions(
    query: string,
    point: Position,
    externalFragments?: FragmentDefinitionNode[],
    options?: AutocompleteSuggestionOptions & { ignoreInsert?: boolean },
  ): Array<CompletionItem> {
    return getAutocompleteSuggestions(
      schema,
      query,
      point,
      undefined,
      externalFragments,
      options,
    )
      .filter(field => !['__schema', '__type'].includes(field.label))
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(suggestion => {
        // TODO: A PR where we do `const { type, ..rest} = suggestion; return rest;`
        // and validate the entire completion object - kinds, documentation, etc
        const response = { label: suggestion.label } as CompletionItem;
        if (suggestion.detail) {
          response.detail = String(suggestion.detail);
        }
        if (suggestion.insertText && !options?.ignoreInsert) {
          response.insertText = suggestion.insertText;
        }
        if (suggestion.insertTextFormat && !options?.ignoreInsert) {
          response.insertTextFormat = suggestion.insertTextFormat;
        }
        if (suggestion.command && !options?.ignoreInsert) {
          response.command = suggestion.command;
        }
        if (suggestion.documentation) {
          response.documentation = suggestion.documentation;
        }
        if (suggestion.labelDetails && !options?.ignoreInsert) {
          response.labelDetails = suggestion.labelDetails;
        }

        return response;
      });
  }
  describe('with Operation types', () => {
    const expectedDirectiveSuggestions = [
      { label: 'include', documentation: GraphQLIncludeDirective.description },
      { label: 'skip', documentation: GraphQLSkipDirective.description },
    ];

    // TODO: remove this once defer and stream are merged to `graphql`
    if (graphQLVersion.startsWith('16.0.0-experimental-stream-defer')) {
      // @ts-expect-error
      expectedDirectiveSuggestions.push({ label: 'stream' }, { label: 'test' });
    } else {
      // @ts-expect-error
      expectedDirectiveSuggestions.push({ label: 'test' });
    }

    it('provides correct sortText response', () => {
      const result = getAutocompleteSuggestions(
        schema,
        '{ h',
        new Position(0, 3),
      ).map(({ sortText, label, detail }) => ({ sortText, label, detail }));
      expect(result).toEqual([
        {
          sortText: '0hero',
          label: 'hero',
          detail: 'Character',
        },

        {
          sortText: '1human',
          label: 'human',
          detail: 'Human',
        },

        {
          sortText: '7__schema',
          label: '__schema',
          detail: '__Schema!',
        },
      ]);
    });

    it('provides correct initial keywords', () => {
      expect(testSuggestions('', new Position(0, 0))).toEqual([
        { label: '{' },
        { label: 'extend' },
        { label: 'fragment' },
        { label: 'input' },
        { label: 'interface' },
        { label: 'mutation' },
        { label: 'query' },
        { label: 'scalar' },
        { label: 'schema' },
        { label: 'subscription' },
        { label: 'type' },
        { label: 'union' },
      ]);

      expect(testSuggestions('q', new Position(0, 1))).toEqual([
        { label: '{' },
        { label: 'query' },
      ]);
    });

    it('provides correct top level suggestions when a simple query is already present', () => {
      // Below should provide initial keywords
      expect(testSuggestions(' { id }', new Position(0, 0))).toEqual([
        { label: '{' },
        { label: 'fragment' },
        { label: 'mutation' },
        { label: 'query' },
        { label: 'subscription' },
      ]);

      // Below should provide root field names
      expect(
        testSuggestions(' {}', new Position(0, 2), [], {
          ignoreInsert: true,
        }),
      ).toEqual([
        expectedResults.__typename,
        expectedResults.droid,
        expectedResults.hero,
        expectedResults.human,
        expectedResults.inputTypeTest,
        expectedResults.union,
      ]);

      // Test for query text with empty lines
      expect(
        testSuggestions(
          `
  query name {
    ...testFragment
  }
      `,
          new Position(2, 0),
          [],
          {
            ignoreInsert: true,
          },
        ),
      ).toEqual([
        expectedResults.__typename,
        expectedResults.droid,
        expectedResults.hero,
        expectedResults.human,
        expectedResults.inputTypeTest,
        expectedResults.union,
      ]);
    });

    it('provides correct field name suggestions', () => {
      const result = testSuggestions('{ ', new Position(0, 2), [], {
        ignoreInsert: true,
      });
      expect(result).toEqual([
        expectedResults.__typename,
        expectedResults.droid,
        expectedResults.hero,
        expectedResults.human,
        expectedResults.inputTypeTest,
        expectedResults.union,
      ]);
    });

    it('provides correct field name suggestions after filtered', () => {
      const result = testSuggestions('{ h ', new Position(0, 3), [], {
        ignoreInsert: true,
      });
      expect(result).toEqual([expectedResults.hero, expectedResults.human]);
    });

    it('provides correct field name suggestions with alias', () => {
      const result = testSuggestions(
        '{ alias: human(id: "1") { ',
        new Position(0, 26),
        [],
        {
          ignoreInsert: true,
        },
      );

      expect(result).toEqual([
        expectedResults.__typename,
        expectedResults.appearsIn,
        expectedResults.friends,
        { label: 'id', detail: 'String!' },
        { label: 'name', detail: 'String' },
        { label: 'secretBackstory', detail: 'String' },
      ]);
    });

    it('provides correct field name suggestions with insertText', () => {
      const result = testSuggestions('{ ', new Position(0, 2), [], {
        ignoreInsert: false,
        fillLeafsOnComplete: true,
      });
      expect(result).toEqual([
        {
          ...expectedResults.__typename,
          command: suggestionCommand,
          insertTextFormat: 2,
          insertText: '__typename\n',
          labelDetails: { detail: ' String!' },
        },
        {
          ...expectedResults.droid,
          command: suggestionCommand,
          insertTextFormat: 2,
          insertText: 'droid(id: $1)  {\n   $1\n}',
          labelDetails: { detail: ' Droid' },
        },
        {
          ...expectedResults.hero,
          command: suggestionCommand,
          insertTextFormat: 2,
          insertText: 'hero {\n   $1\n}',
          labelDetails: { detail: ' Character' },
        },
        {
          ...expectedResults.human,
          command: suggestionCommand,
          insertTextFormat: 2,
          insertText: 'human(id: $1)  {\n   $1\n}',
          labelDetails: { detail: ' Human' },
        },
        {
          ...expectedResults.inputTypeTest,
          command: suggestionCommand,
          insertTextFormat: 2,
          insertText: 'inputTypeTest {\n   $1\n}',
          labelDetails: { detail: ' TestType' },
        },
        {
          label: 'union',
          insertTextFormat: 2,
          insertText: 'union {\n   $1\n}',
          detail: 'TestUnion',
          command: suggestionCommand,
          labelDetails: {
            detail: ' TestUnion',
          },
        },
      ]);
    });
    it('provides correct type suggestions for fragments', () => {
      const result = testSuggestions('fragment test on ', new Position(0, 17));

      expect(result).toEqual([
        { label: 'AnotherInterface' },
        { label: 'Character' },
        { label: 'Droid' },
        { label: 'Human' },
        { label: 'Query' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]);
    });

    it('provides correct field suggestions for fragments', () => {
      const result = testSuggestions(
        'fragment test on Human { ',
        new Position(0, 25),
        [],
        {
          ignoreInsert: true,
        },
      );

      expect(result).toEqual([
        expectedResults.__typename,
        expectedResults.appearsIn,
        expectedResults.friends,
        { label: 'id', detail: 'String!' },
        { label: 'name', detail: 'String' },
        { label: 'secretBackstory', detail: 'String' },
      ]);
    });

    it('provides correct argument suggestions', () => {
      const result = testSuggestions('{ human (', new Position(0, 9));
      expect(result).toEqual([
        {
          label: 'id',
          insertText: 'id: ',
          command: suggestionCommand,
          insertTextFormat: 2,
          labelDetails: { detail: ' String!' },
        },
      ]);
    });

    it('provides correct argument suggestions when using aliases', () => {
      const result = testSuggestions(
        '{ aliasTest: human( ',
        new Position(0, 20),
      );
      expect(result).toEqual([
        {
          label: 'id',
          command: suggestionCommand,
          insertText: 'id: ',
          insertTextFormat: 2,
          labelDetails: { detail: ' String!' },
        },
      ]);
    });
    const metaArgs = [
      {
        label: '__DirectiveLocation',
        documentation:
          'A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.',
      },
      {
        label: '__TypeKind',
        documentation:
          'An enum describing what kind of type a given `__Type` is.',
      },
    ];
    it('provides correct input type suggestions', () => {
      const result = testSuggestions(
        'query($exampleVariable: ) { ',
        new Position(0, 24),
      );
      expect(result).toEqual([
        ...metaArgs,
        { label: 'Boolean', documentation: GraphQLBoolean.description },
        { label: 'Episode' },
        { label: 'InputType' },
        { label: 'Int', documentation: GraphQLInt.description },
        { label: 'String', documentation: GraphQLString.description },
      ]);
    });

    it('provides filtered input type suggestions', () => {
      const result = testSuggestions(
        'query($exampleVariable: In) { ',
        new Position(0, 26),
      );
      expect(result).toEqual([
        ...metaArgs,

        { label: 'InputType' },
        { label: 'Int', documentation: GraphQLInt.description },
        { label: 'String', documentation: GraphQLString.description },
      ]);
    });

    it('provides correct typeCondition suggestions', () => {
      const suggestionsOnQuery = testSuggestions(
        '{ ... on ',
        new Position(0, 9),
      );
      expect(
        suggestionsOnQuery.filter(({ label }) => !label.startsWith('__')),
      ).toEqual([{ label: 'Query' }]);

      const suggestionsOnCompositeType = testSuggestions(
        '{ hero(episode: JEDI) { ... on } }',
        new Position(0, 31),
      );

      expect(suggestionsOnCompositeType).toEqual([
        { label: 'Character' },
        { label: 'Droid' },
        { label: 'Human' },
      ]);

      expect(
        testSuggestions(
          'fragment Foo on Character { ... on }',
          new Position(0, 35),
        ),
      ).toEqual([
        { label: 'Character' },
        { label: 'Droid' },
        { label: 'Human' },
      ]);
    });

    it('provides correct typeCondition suggestions on fragment', () => {
      const result = testSuggestions('fragment Foo on {}', new Position(0, 16));
      expect(result.filter(({ label }) => !label.startsWith('__'))).toEqual([
        { label: 'AnotherInterface' },
        { label: 'Character' },
        { label: 'Droid' },
        { label: 'Human' },
        { label: 'Query' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]);
    });

    it('provides correct enum suggestions', () => {
      const result = testSuggestions('{ hero(episode: ', new Position(0, 16));
      expect(result).toEqual([
        { label: 'EMPIRE', detail: 'Episode' },
        { label: 'JEDI', detail: 'Episode' },
        { label: 'NEWHOPE', detail: 'Episode' },
      ]);
    });

    it('provides correct suggestions for declared variables upon typing $', () => {
      const result = testSuggestions(
        'query($id: String, $ep: Episode!){ hero(episode: $ }',
        new Position(0, 51),
      );
      expect(result).toEqual([
        { label: '$ep', insertText: 'ep', detail: 'Episode' },
      ]);
    });

    it('provides correct suggestions for variables based on argument context', () => {
      const result = testSuggestions(
        'query($id: String!, $episode: Episode!){ hero(episode: ',
        new Position(0, 55),
      );
      expect(result).toEqual([
        { label: '$episode', detail: 'Episode', insertText: '$episode' },
        { label: 'EMPIRE', detail: 'Episode' },

        { label: 'JEDI', detail: 'Episode' },
        { label: 'NEWHOPE', detail: 'Episode' },
        // no $id here, it's not compatible :P
      ]);
    });

    it('provides fragment name suggestion', () => {
      const fragmentDef = 'fragment Foo on Human { id }';

      // Test on concrete types
      expect(
        testSuggestions(
          `${fragmentDef} query { human(id: "1") { ...`,
          new Position(0, 57),
        ),
      ).toEqual([
        {
          label: 'Foo',
          detail: 'Human',
          labelDetails: { detail: 'fragment Foo on Human' },
        },
      ]);
      expect(
        testSuggestions(
          `query { human(id: "1") { ... }} ${fragmentDef}`,
          new Position(0, 28),
        ),
      ).toEqual([
        {
          label: 'Foo',
          detail: 'Human',
          labelDetails: { detail: 'fragment Foo on Human' },
        },
      ]);

      // Test on abstract type
      expect(
        testSuggestions(
          `${fragmentDef} query { hero(episode: JEDI) { ...`,
          new Position(0, 62),
        ),
      ).toEqual([
        {
          label: 'Foo',
          detail: 'Human',
          labelDetails: { detail: 'fragment Foo on Human' },
        },
      ]);
    });

    it('provides correct fragment name suggestions for external fragments', () => {
      const externalFragments = parse(`
        fragment CharacterDetails on Human {
          name
        }
        fragment CharacterDetails2 on Human {
          name
        }
      `).definitions as FragmentDefinitionNode[];

      const result = testSuggestions(
        'query { human(id: "1") { ... }}',
        new Position(0, 28),
        externalFragments,
      );

      expect(result).toEqual([
        {
          label: 'CharacterDetails',
          detail: 'Human',
          labelDetails: { detail: 'fragment CharacterDetails on Human' },
        },
        {
          label: 'CharacterDetails2',
          detail: 'Human',
          labelDetails: { detail: 'fragment CharacterDetails2 on Human' },
        },
      ]);
    });

    it('provides correct directive suggestions', () => {
      expect(testSuggestions('{ test @ }', new Position(0, 8))).toEqual(
        expectedDirectiveSuggestions,
      );

      expect(testSuggestions('{ test @', new Position(0, 8))).toEqual(
        expectedDirectiveSuggestions,
      );

      expect(
        testSuggestions('{ aliasTest: test @ }', new Position(0, 19)),
      ).toEqual(expectedDirectiveSuggestions);

      expect(testSuggestions('query @', new Position(0, 7))).toEqual([]);
    });

    it('provides correct directive field suggestions', () => {
      expect(
        testSuggestions('{ test @deprecated(', new Position(0, 19)),
      ).toEqual([
        {
          command: suggestionCommand,
          label: 'reason',
          insertTextFormat: 2,
          insertText: 'reason: ',
          documentation: GraphQLDeprecatedDirective.args[0].description,
          labelDetails: {
            detail: ' String',
          },
        },
      ]);
    });
    const inputArgs = [
      {
        label: 'key',
        detail: 'String!',
        insertText: 'key: ',
        insertTextFormat: 2,
        command: suggestionCommand,
      },
      {
        detail: 'InputType',
        label: 'obj',
        insertText: 'obj:  {\n   $1\n}',
        command: suggestionCommand,
        insertTextFormat: 2,
      },
      {
        label: 'value',
        detail: 'Int',
        insertText: 'value: ',
        insertTextFormat: 2,
        command: suggestionCommand,
      },
    ];
    it('provides correct testInput type field suggestions', () => {
      expect(
        testSuggestions('{ inputTypeTest(args: {', new Position(0, 23)),
      ).toEqual(inputArgs);
    });

    it('provides correct nested testInput type field suggestions', () => {
      expect(
        testSuggestions('{ inputTypeTest(args: { obj: {', new Position(0, 30)),
      ).toEqual(inputArgs);
    });

    it('provides correct field name suggestion inside inline fragment', () => {
      expect(
        testSuggestions(
          'fragment Foo on Character { ... on Human { }}',
          new Position(0, 42),
          [],
          {
            ignoreInsert: true,
          },
        ),
      ).toEqual([
        expectedResults.__typename,
        expectedResults.appearsIn,
        expectedResults.friends,
        { label: 'id', detail: 'String!' },
        { label: 'name', detail: 'String' },
        { label: 'secretBackstory', detail: 'String' },
      ]);

      // Type-less inline fragment assumes the type automatically
      expect(
        testSuggestions(
          'fragment Foo on Droid { ... { ',
          new Position(0, 30),
          [],
          {
            ignoreInsert: true,
          },
        ),
      ).toEqual([
        expectedResults.__typename,
        expectedResults.appearsIn,
        expectedResults.friends,
        { label: 'id', detail: 'String!' },
        { label: 'instructions', detail: '[String]!' },
        { label: 'name', detail: 'String' },
        { label: 'primaryFunction', detail: 'String' },
        { label: 'secretBackstory', detail: 'String' },
      ]);
    });
  });

  describe('with SDL types', () => {
    it('provides correct initial keywords w/ graphqls', () => {
      expect(
        testSuggestions('', new Position(0, 0), [], { uri: 'schema.graphqls' }),
      ).toEqual([
        { label: 'extend' },
        { label: 'input' },
        { label: 'interface' },
        { label: 'scalar' },
        { label: 'schema' },
        { label: 'type' },
        { label: 'union' },
      ]);
    });

    it('provides correct initial keywords w/out graphqls', () => {
      expect(
        testSuggestions('', new Position(0, 0), [], { uri: 'schema.graphql' }),
      ).toEqual([
        { label: '{' },
        { label: 'extend' },
        { label: 'fragment' },
        { label: 'input' },
        { label: 'interface' },
        { label: 'mutation' },
        { label: 'query' },
        { label: 'scalar' },
        { label: 'schema' },
        { label: 'subscription' },
        { label: 'type' },
        { label: 'union' },
      ]);
    });

    it('provides correct initial definition keywords', () => {
      expect(
        testSuggestions('type Type { field: String }\n\n', new Position(0, 31)),
      ).toEqual([
        { label: 'extend' },
        { label: 'input' },
        { label: 'interface' },
        { label: 'scalar' },
        { label: 'schema' },
        { label: 'type' },
        { label: 'union' },
      ]);
    });

    it('provides correct extension keywords', () => {
      expect(testSuggestions('extend ', new Position(0, 7))).toEqual([
        { label: 'input' },
        { label: 'interface' },
        { label: 'scalar' },
        { label: 'schema' },
        { label: 'type' },
        { label: 'union' },
      ]);
    });

    it('provides scalars to be extended', () => {
      expect(testSuggestions('extend scalar ', new Position(0, 14))).toEqual([
        { label: 'Boolean' },
        { label: 'Int' },
        { label: 'String' },
      ]);
    });

    it('provides object types to be extended', () => {
      expect(testSuggestions('extend type ', new Position(0, 12))).toEqual([
        { label: 'Droid' },
        { label: 'Human' },
        { label: 'Query' },
        { label: 'TestType' },
      ]);
    });

    it('does not provide object type names once extending a type', () => {
      expect(
        testSuggestions('extend type Query {', new Position(0, 19)),
      ).toEqual([]);
    });

    it('provides interfaces to be extended', () => {
      expect(testSuggestions('extend interface ', new Position(0, 17))).toEqual(
        [
          { label: 'AnotherInterface' },
          { label: 'Character' },
          { label: 'TestInterface' },
        ],
      );
    });

    it('provides unions to be extended', () => {
      expect(testSuggestions('extend union ', new Position(0, 13))).toEqual([
        { label: 'TestUnion' },
      ]);
    });

    it('provides enums to be extended', () => {
      expect(testSuggestions('extend enum ', new Position(0, 12))).toEqual([
        { label: 'Episode' },
      ]);
    });

    it('provides input objects to be extended', () => {
      expect(testSuggestions('extend input ', new Position(0, 13))).toEqual([
        { label: 'InputType' },
      ]);
    });

    it('provides correct directive suggestions on definitions', () =>
      expect(testSuggestions('type Type @', new Position(0, 11))).toEqual([
        { label: 'onAllDefs' },
      ]));
    it('provides correct suggestions on object field w/ .graphqls', () =>
      expect(
        testSuggestions('type Type {\n  aField: s', new Position(0, 23), [], {
          uri: 'schema.graphqls',
          ignoreInsert: true,
        }),
      ).toEqual([
        { label: 'Episode' },
        { label: 'String' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]));

    it('provides correct argument type suggestions on directive definitions', () =>
      expect(
        testSuggestions(
          'directive @skip(if: ) on FIELD | FRAGMENT_SPREAD | INLINE_FRAGMENT',
          new Position(0, 19),
          [],
          {
            ignoreInsert: true,
          },
        ),
      ).toEqual([
        { label: 'Boolean' },
        { label: 'Episode' },
        { label: 'InputType' },
        { label: 'Int' },
        { label: 'String' },
      ]));

    it('provides correct suggestions on object field w/ .graphqls', () =>
      expect(
        testSuggestions('type Type {\n  aField: s', new Position(0, 23), [], {
          uri: 'schema.graphqls',
          ignoreInsert: true,
        }),
      ).toEqual([
        { label: 'Episode' },
        { label: 'String' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]));
    it('provides correct suggestions on object fields', () =>
      expect(
        testSuggestions('type Type {\n  aField: s', new Position(0, 23), [], {
          uri: 'schema.graphql',
          ignoreInsert: true,
        }),
      ).toEqual([
        { label: 'Episode' },
        { label: 'String' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]));
    // TODO: shouldn't TestType and TestUnion be available here?
    it('provides correct filtered suggestions on object fields in regular SDL files', () =>
      expect(
        testSuggestions('type Type {\n  aField: s', new Position(0, 23), [], {
          uri: 'schema.graphql',
          ignoreInsert: true,
        }),
      ).toEqual([
        { label: 'Episode' },
        { label: 'String' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]));
    it('provides correct unfiltered suggestions on object fields in regular SDL files', () =>
      expect(
        testSuggestions('type Type {\n  aField: ', new Position(0, 22), [], {
          uri: 'schema.graphql',
          ignoreInsert: true,
        }),
      ).toEqual([
        { label: 'AnotherInterface' },
        { label: 'Boolean' },
        { label: 'Character' },
        { label: 'Droid' },
        { label: 'Episode' },
        { label: 'Human' },
        { label: 'Int' },
        // TODO: maybe filter out types attached to top level schema?
        { label: 'Query' },
        { label: 'String' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]));
    it('provides correct suggestions on object fields that are arrays', () =>
      expect(
        testSuggestions('type Type {\n  aField: []', new Position(0, 25), [], {
          uri: 'schema.graphqls',
          ignoreInsert: true,
        }),
      ).toEqual([
        { label: 'AnotherInterface' },
        { label: 'Boolean' },
        { label: 'Character' },
        { label: 'Droid' },
        { label: 'Episode' },
        { label: 'Human' },
        { label: 'Int' },
        { label: 'Query' },
        { label: 'String' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]));
    it('provides correct suggestions on object fields that are arrays in SDL context', () =>
      expect(
        testSuggestions('type Type {\n  aField: []', new Position(0, 25), [], {
          uri: 'schema.graphql',
          ignoreInsert: true,
        }),
      ).toEqual([
        { label: 'AnotherInterface' },
        { label: 'Boolean' },
        { label: 'Character' },
        { label: 'Droid' },
        { label: 'Episode' },
        { label: 'Human' },
        { label: 'Int' },
        { label: 'Query' },
        { label: 'String' },
        { label: 'TestInterface' },
        { label: 'TestType' },
        { label: 'TestUnion' },
      ]));
    it('provides correct suggestions on input object fields', () =>
      expect(
        testSuggestions('input Type {\n  aField: s', new Position(0, 23), [], {
          uri: 'schema.graphqls',
        }),
      ).toEqual([
        { label: 'Episode' },
        { label: 'String', documentation: GraphQLString.description },
      ]));
    it('provides correct directive suggestions on args definitions', () =>
      expect(
        testSuggestions('type Type { field(arg: String @', new Position(0, 31)),
      ).toEqual([
        {
          label: 'deprecated',
          documentation: GraphQLDeprecatedDirective.description,
        },
        { label: 'onAllDefs' },
        { label: 'onArg' },
      ]));

    it('provides correct interface suggestions when extending with an interface', () =>
      expect(
        testSuggestions('type Type implements ', new Position(0, 20)),
      ).toEqual([
        { label: 'AnotherInterface' },
        { label: 'Character' },
        { label: 'TestInterface' },
      ]));

    it('provides correct interface suggestions when extending a type with multiple interfaces', () =>
      expect(
        testSuggestions(
          'type Type implements TestInterface & ',
          new Position(0, 37),
        ),
      ).toEqual([{ label: 'AnotherInterface' }, { label: 'Character' }]));
    it('provides correct interface suggestions when extending an interface with multiple interfaces', () =>
      expect(
        testSuggestions(
          'interface IExample implements TestInterface & ',
          new Position(0, 46),
        ),
      ).toEqual([{ label: 'AnotherInterface' }, { label: 'Character' }]));
    it('provides filtered interface suggestions when extending an interface with multiple interfaces', () =>
      expect(
        testSuggestions(
          'interface IExample implements TestInterface & Inter',
          new Position(0, 48),
        ),
      ).toEqual([{ label: 'AnotherInterface' }]));
    it('provides no interface suggestions when using implements and there are no & or { characters present', () =>
      expect(
        testSuggestions(
          'interface IExample implements TestInterface ',
          new Position(0, 44),
        ),
      ).toEqual([]));
    it('provides fragment completion after a list of interfaces to extend', () =>
      expect(
        testSuggestions(
          'interface IExample implements TestInterface & AnotherInterface @f',
          new Position(0, 65),
        ),
      ).toEqual([{ label: 'onAllDefs' }]));
    it('provides correct interface suggestions when extending an interface with an inline interface', () =>
      expect(
        testSuggestions(
          'interface A { id: String }\ninterface MyInterface implements ',
          new Position(1, 33),
        ),
      ).toEqual([
        { label: 'A' },
        { label: 'AnotherInterface' },
        { label: 'Character' },
        { label: 'TestInterface' },
      ]));
  });
});
