/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {AutocompleteSuggestionType} from '../../types/Types';

import {expect} from 'chai';
import {beforeEach, describe, it} from 'mocha';
import fs from 'fs';
import {getNamedType} from 'graphql/type';
import {buildSchema} from 'graphql/utilities';
import path from 'path';

import {Point} from '../../utils/Range';
import {
  getAutocompleteSuggestions,
} from '../getAutocompleteSuggestions';

describe('getAutocompleteSuggestions', () => {
  let schema;
  beforeEach(async () => {
    const schemaIDL = fs.readFileSync(
      path.join(__dirname, '../../__tests__/__schema__/StarWarsSchema.graphql'),
      'utf8',
    );
    schema = buildSchema(schemaIDL);
  });

  // Returns a soreted autocomplete suggestions in an increasing order.
  function testSuggestions(
    query: string,
    point: Point,
  ): Array<AutocompleteSuggestionType> {
    return getAutocompleteSuggestions(schema, query, point).filter(
      field => !['__schema', '__type'].some(name => name === field.text),
    ).sort(
      (a, b) => a.text.localeCompare(b.text),
    ).map(suggestion => {
      const response = {text: suggestion.text};
      if (suggestion.type) {
        Object.assign(response, {type: getNamedType(suggestion.type).name});
      }
      return response;
    });
  }

  it('provides correct initial keywords', () => {
    expect(
      testSuggestions('', new Point(0, 0)),
    ).to.deep.equal([
      {text: '{'},
      {text: 'fragment'},
      {text: 'mutation'},
      {text: 'query'},
      {text: 'subscription'},
    ]);

    expect(
      testSuggestions('q', new Point(0, 1)),
    ).to.deep.equal([
      {text: '{'},
      {text: 'query'},
    ]);
  });

  it('provides correct suggestions at where the cursor is', () => {
    // Below should provide initial keywords
    expect(
      testSuggestions(' {}', new Point(0, 0)),
    ).to.deep.equal([
      {text: '{'},
      {text: 'fragment'},
      {text: 'mutation'},
      {text: 'query'},
      {text: 'subscription'},
    ]);
    // Below should provide root field names
    expect(
      testSuggestions(' {}', new Point(0, 2)),
    ).to.deep.equal([
      {text: 'droid', type: 'Droid'},
      {text: 'hero', type: 'Character'},
      {text: 'human', type: 'Human'},
      {text: 'inputTypeTest', type: 'TestType'},
    ]);
  });

  it('provides correct field name suggestions', () => {
    const result = testSuggestions('{ ', new Point(0, 2));
    expect(result).to.deep.equal([
      {text: 'droid', type: 'Droid'},
      {text: 'hero', type: 'Character'},
      {text: 'human', type: 'Human'},
      {text: 'inputTypeTest', type: 'TestType'},
    ]);
  });

  it('provides correct field name suggestions after filtered', () => {
    const result = testSuggestions('{ h ', new Point(0, 3));
    expect(result).to.deep.equal([
      {text: 'hero', type: 'Character'},
      {text: 'human', type: 'Human'},
    ]);
  });

  it('provides correct field name suggestions with alias', () => {
    const result = testSuggestions(
      '{ alias: human(id: "1") { ',
      new Point(0, 26),
    );

    expect(result).to.deep.equal([
      {text: 'appearsIn', type: 'Episode'},
      {text: 'friends', type: 'Character'},
      {text: 'id', type: 'String'},
      {text: 'name', type: 'String'},
      {text: 'secretBackstory', type: 'String'},
    ]);
  });

  it('provides correct field suggestions for fragments', () => {
    const result = testSuggestions(
      'fragment test on Human { ',
      new Point(0, 25),
    );
    expect(result).to.deep.equal([
      {text: 'appearsIn', type: 'Episode'},
      {text: 'friends', type: 'Character'},
      {text: 'id', type: 'String'},
      {text: 'name', type: 'String'},
      {text: 'secretBackstory', type: 'String'},
    ]);
  });

  it('provides correct argument suggestions', () => {
    const result = testSuggestions('{ human (', new Point(0, 9));
    expect(result).to.deep.equal([{text: 'id', type: 'String'}]);
  });

  it('provides correct argument suggestions when using aliases', () => {
    const result = testSuggestions(
      '{ aliasTest: human( ',
      new Point(0, 20),
    );
    expect(result).to.deep.equal([{text: 'id', type: 'String'}]);
  });

  it('provides correct typeCondition suggestions', () => {
    const suggestionsOnQuery = testSuggestions('{ ... on ', new Point(0, 9));
    expect(
      suggestionsOnQuery.filter(({text}) => !text.startsWith('__')),
    ).to.deep.equal([{text: 'Query'}]);

    const suggestionsOnCompositeType = testSuggestions(
      '{ hero(episode: JEDI) { ... on } }', new Point(0, 31),
    );
    expect(suggestionsOnCompositeType).to.deep.equal([
      {text: 'Character'},
      {text: 'Droid'},
      {text: 'Human'},
    ]);

    expect(testSuggestions(
      'fragment Foo on Character { ... on }',
      new Point(0, 35),
    )).to.deep.equal([
      {text: 'Character'},
      {text: 'Droid'},
      {text: 'Human'},
    ]);
  });

  it('provides correct typeCondition suggestions on fragment', () => {
    const result = testSuggestions(
      'fragment Foo on {}',
      new Point(0, 16),
    );
    expect(result.filter(({text}) => !text.startsWith('__'))).to.deep.equal([
      {text: 'Character'},
      {text: 'Droid'},
      {text: 'Human'},
      {text: 'Query'},
      {text: 'TestType'},
    ]);
  });

  it('provides correct ENUM suggestions', () => {
    const result = testSuggestions(
      '{ hero(episode: ', new Point(0, 16),
    );
    expect(result).to.deep.equal([
      {text: 'EMPIRE', type: 'Episode'},
      {text: 'JEDI', type: 'Episode'},
      {text: 'NEWHOPE', type: 'Episode'},
    ]);
  });

  it('provides fragment name suggestion', () => {
    const fragmentDef = 'fragment Foo on Human { id }';

    // Test on concrete types
    expect(testSuggestions(
      `${fragmentDef} query { human(id: "1") { ...`,
      new Point(0, 57),
    )).to.deep.equal([
      {text: 'Foo', type: 'Human'},
    ]);
    expect(testSuggestions(
      `query { human(id: "1") { ... }} ${fragmentDef}`,
      new Point(0, 28),
    )).to.deep.equal([
      {text: 'Foo', type: 'Human'},
    ]);

    // Test on abstract type
    expect(testSuggestions(
      `${fragmentDef} query { hero(episode: JEDI) { ...`,
      new Point(0, 62),
    )).to.deep.equal([
      {text: 'Foo', type: 'Human'},
    ]);
  });

  it('provides correct directive suggestions', () => {
    expect(testSuggestions(
      '{ test @',
      new Point(0, 8),
    )).to.deep.equal([
      {text: 'include'},
      {text: 'skip'},
      {text: 'test'},
    ]);
    expect(testSuggestions(
      '{ aliasTest: test @ }',
      new Point(0, 19),
    )).to.deep.equal([
      {text: 'include'},
      {text: 'skip'},
      {text: 'test'},
    ]);
    expect(
      testSuggestions('query @', new Point(0, 7)),
    ).to.deep.equal([]);
  });

  it('provides correct testInput suggestions', () => {
    expect(testSuggestions(
      '{ inputTypeTest(args: {',
      new Point(0, 23),
    )).to.deep.equal([
      {text: 'key', type: 'String'},
      {text: 'value', type: 'Int'},
    ]);
  });

  it('provides correct field name suggestion inside inline fragment', () => {
    expect(testSuggestions(
      'fragment Foo on Character { ... on Human { }}',
      new Point(0, 42),
    )).to.deep.equal([
      {text: 'appearsIn', type: 'Episode'},
      {text: 'friends', type: 'Character'},
      {text: 'id', type: 'String'},
      {text: 'name', type: 'String'},
      {text: 'secretBackstory', type: 'String'},
    ]);

    // Typeless inline fragment assumes the type automatically
    expect(testSuggestions(
      'fragment Foo on Droid { ... { ',
      new Point(0, 30),
    )).to.deep.equal([
      {text: 'appearsIn', type: 'Episode'},
      {text: 'friends', type: 'Character'},
      {text: 'id', type: 'String'},
      {text: 'name', type: 'String'},
      {text: 'primaryFunction', type: 'String'},
      {text: 'secretBackstory', type: 'String'},
    ]);
  });
});
