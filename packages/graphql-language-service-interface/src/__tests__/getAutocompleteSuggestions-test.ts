/**
 *  Copyright (c) 2020 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { CompletionItem } from 'graphql-language-service-types';

import fs from 'fs';
import {
  buildSchema,
  FragmentDefinitionNode,
  GraphQLSchema,
  parse,
} from 'graphql';
import { Position } from 'graphql-language-service-utils';
import path from 'path';

import { getAutocompleteSuggestions } from '../getAutocompleteSuggestions';

describe('getAutocompleteSuggestions', () => {
  let schema: GraphQLSchema;
  beforeEach(async () => {
    const schemaIDL = fs.readFileSync(
      path.join(__dirname, '__schema__/StarWarsSchema.graphql'),
      'utf8',
    );

    schema = buildSchema(schemaIDL);
  });

  // Returns a soreted autocomplete suggestions in an increasing order.
  function testSuggestions(
    query: string,
    point: Position,
    externalFragments?: FragmentDefinitionNode[],
  ): Array<CompletionItem> {
    return getAutocompleteSuggestions(
      schema,
      query,
      point,
      null,
      externalFragments,
    )
      .filter(
        field => !['__schema', '__type'].some(name => name === field.label),
      )
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(suggestion => {
        const response = { label: suggestion.label } as CompletionItem;
        if (suggestion.detail) {
          response.detail = String(suggestion.detail);
        }
        // if(suggestion.documentation) {
        //   response.documentation = String(suggestion.documentation)
        // }
        return response;
      });
  }

  it('provides correct sortText response', () => {
    const result = getAutocompleteSuggestions(
      schema,
      `{ h`,
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
        sortText: '6__schema',
        label: '__schema',
        detail: '__Schema!',
      },
    ]);
  });

  it('provides correct initial keywords', () => {
    expect(testSuggestions('', new Position(0, 0))).toEqual([
      { label: '{' },
      { label: 'fragment' },
      { label: 'mutation' },
      { label: 'query' },
      { label: 'subscription' },
    ]);

    expect(testSuggestions('q', new Position(0, 1))).toEqual([
      { label: '{' },
      { label: 'query' },
    ]);
  });

  it('provides correct suggestions at where the cursor is', () => {
    // Below should provide initial keywords
    expect(testSuggestions(' {}', new Position(0, 0))).toEqual([
      { label: '{' },
      { label: 'fragment' },
      { label: 'mutation' },
      { label: 'query' },
      { label: 'subscription' },
    ]);

    // Below should provide root field names
    expect(testSuggestions(' {}', new Position(0, 2))).toEqual([
      { label: '__typename', detail: 'String!' },
      { label: 'droid', detail: 'Droid' },
      { label: 'hero', detail: 'Character' },
      { label: 'human', detail: 'Human' },
      { label: 'inputTypeTest', detail: 'TestType' },
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
      ),
    ).toEqual([
      { label: '__typename', detail: 'String!' },
      { label: 'droid', detail: 'Droid' },
      { label: 'hero', detail: 'Character' },
      { label: 'human', detail: 'Human' },
      { label: 'inputTypeTest', detail: 'TestType' },
    ]);
  });

  it('provides correct field name suggestions', () => {
    const result = testSuggestions('{ ', new Position(0, 2));
    expect(result).toEqual([
      { label: '__typename', detail: 'String!' },
      { label: 'droid', detail: 'Droid' },
      { label: 'hero', detail: 'Character' },
      { label: 'human', detail: 'Human' },
      { label: 'inputTypeTest', detail: 'TestType' },
    ]);
  });

  it('provides correct field name suggestions after filtered', () => {
    const result = testSuggestions('{ h ', new Position(0, 3));
    expect(result).toEqual([
      { label: 'hero', detail: 'Character' },
      { label: 'human', detail: 'Human' },
    ]);
  });

  it('provides correct field name suggestions with alias', () => {
    const result = testSuggestions(
      '{ alias: human(id: "1") { ',
      new Position(0, 26),
    );

    expect(result).toEqual([
      { label: '__typename', detail: 'String!' },
      { label: 'appearsIn', detail: '[Episode]' },
      { label: 'friends', detail: '[Character]' },
      { label: 'id', detail: 'String!' },
      { label: 'name', detail: 'String' },
      { label: 'secretBackstory', detail: 'String' },
    ]);
  });

  it('provides correct field suggestions for fragments', () => {
    const result = testSuggestions(
      'fragment test on Human { ',
      new Position(0, 25),
    );

    expect(result).toEqual([
      { label: '__typename', detail: 'String!' },
      { label: 'appearsIn', detail: '[Episode]' },
      { label: 'friends', detail: '[Character]' },
      { label: 'id', detail: 'String!' },
      { label: 'name', detail: 'String' },
      { label: 'secretBackstory', detail: 'String' },
    ]);
  });

  it('provides correct argument suggestions', () => {
    const result = testSuggestions('{ human (', new Position(0, 9));
    expect(result).toEqual([{ label: 'id', detail: 'String!' }]);
  });

  it('provides correct argument suggestions when using aliases', () => {
    const result = testSuggestions('{ aliasTest: human( ', new Position(0, 20));
    expect(result).toEqual([{ label: 'id', detail: 'String!' }]);
  });

  it('provides correct input type suggestions', () => {
    const result = testSuggestions(
      'query($exampleVariable: ) { ',
      new Position(0, 24),
    );
    expect(result).toEqual([
      { label: '__DirectiveLocation' },
      { label: '__TypeKind' },
      { label: 'Boolean' },
      { label: 'Episode' },
      { label: 'InputType' },
      { label: 'Int' },
      { label: 'String' },
    ]);
  });

  it('provides filtered input type suggestions', () => {
    const result = testSuggestions(
      'query($exampleVariable: In) { ',
      new Position(0, 26),
    );
    expect(result).toEqual([
      { label: '__DirectiveLocation' },
      { label: '__TypeKind' },
      { label: 'InputType' },
      { label: 'Int' },
      { label: 'String' },
    ]);
  });

  it('provides correct typeCondition suggestions', () => {
    const suggestionsOnQuery = testSuggestions('{ ... on ', new Position(0, 9));
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
    ).toEqual([{ label: 'Character' }, { label: 'Droid' }, { label: 'Human' }]);
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
    ]);
  });

  it('provides correct ENUM suggestions', () => {
    const result = testSuggestions('{ hero(episode: ', new Position(0, 16));
    expect(result).toEqual([
      { label: 'EMPIRE', detail: 'Episode' },
      { label: 'JEDI', detail: 'Episode' },
      { label: 'NEWHOPE', detail: 'Episode' },
    ]);
  });

  it('provides correct suggestions when autocompleting for declared variable while typing', () => {
    const result = testSuggestions(
      'query($id: String, $ep: Episode!){ hero(episode: $ }',
      new Position(0, 51),
    );
    expect(result).toEqual([{ label: '$ep', detail: 'Episode' }]);
  });

  it('provides correct suggestions when autocompleting for declared variable', () => {
    const result = testSuggestions(
      'query($id: String!, $episode: Episode!){ hero(episode: ',
      new Position(0, 55),
    );
    expect(result).toEqual([
      { label: '$episode', detail: 'Episode' },
      { label: 'EMPIRE', detail: 'Episode' },
      { label: 'JEDI', detail: 'Episode' },
      { label: 'NEWHOPE', detail: 'Episode' },
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
    ).toEqual([{ label: 'Foo', detail: 'Human' }]);
    expect(
      testSuggestions(
        `query { human(id: "1") { ... }} ${fragmentDef}`,
        new Position(0, 28),
      ),
    ).toEqual([{ label: 'Foo', detail: 'Human' }]);

    // Test on abstract type
    expect(
      testSuggestions(
        `${fragmentDef} query { hero(episode: JEDI) { ...`,
        new Position(0, 62),
      ),
    ).toEqual([{ label: 'Foo', detail: 'Human' }]);
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
      { label: 'CharacterDetails', detail: 'Human' },
      { label: 'CharacterDetails2', detail: 'Human' },
    ]);
  });

  it('provides correct directive suggestions', () => {
    expect(testSuggestions('{ test @ }', new Position(0, 8))).toEqual([
      { label: 'include' },
      { label: 'skip' },
      { label: 'test' },
    ]);

    expect(testSuggestions('{ test @', new Position(0, 8))).toEqual([
      { label: 'include' },
      { label: 'skip' },
      { label: 'test' },
    ]);

    expect(
      testSuggestions('{ aliasTest: test @ }', new Position(0, 19)),
    ).toEqual([{ label: 'include' }, { label: 'skip' }, { label: 'test' }]);

    expect(testSuggestions('query @', new Position(0, 7))).toEqual([]);
  });

  it('provides correct testInput suggestions', () => {
    expect(
      testSuggestions('{ inputTypeTest(args: {', new Position(0, 23)),
    ).toEqual([
      { label: 'key', detail: 'String!' },
      { label: 'value', detail: 'Int' },
    ]);
  });

  it('provides correct field name suggestion inside inline fragment', () => {
    expect(
      testSuggestions(
        'fragment Foo on Character { ... on Human { }}',
        new Position(0, 42),
      ),
    ).toEqual([
      { label: '__typename', detail: 'String!' },
      { label: 'appearsIn', detail: '[Episode]' },
      { label: 'friends', detail: '[Character]' },
      { label: 'id', detail: 'String!' },
      { label: 'name', detail: 'String' },
      { label: 'secretBackstory', detail: 'String' },
    ]);

    // Typeless inline fragment assumes the type automatically
    expect(
      testSuggestions('fragment Foo on Droid { ... { ', new Position(0, 30)),
    ).toEqual([
      { label: '__typename', detail: 'String!' },
      { label: 'appearsIn', detail: '[Episode]' },
      { label: 'friends', detail: '[Character]' },
      { label: 'id', detail: 'String!' },
      { label: 'name', detail: 'String' },
      { label: 'primaryFunction', detail: 'String' },
      { label: 'secretBackstory', detail: 'String' },
    ]);
  });

  it('provides correct directive suggestions on definitions', () =>
    expect(testSuggestions('type Type @', new Position(0, 11))).toEqual([
      { label: 'onAllDefs' },
    ]));

  it('provides correct directive suggestions on args definitions', () =>
    expect(
      testSuggestions('type Type { field(arg: String @', new Position(0, 31)),
    ).toEqual([
      { label: 'deprecated' },
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
