/* eslint-disable max-len */
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import { isOutputType, isLeafType } from 'graphql';

import '../hint';
import { TestSchema } from './testSchema';


function createEditorWithHint() {
  return CodeMirror(document.createElement('div'), {
    mode: 'graphql',
    hintOptions: {
      schema: TestSchema,
      closeOnUnfocus: false,
      completeSingle: false
    }
  });
}

function getHintSuggestions(queryString, cursor) {
  var editor = createEditorWithHint();
  return new Promise(resolve => {
    const graphqlHint = CodeMirror.hint.graphql;
    CodeMirror.hint.graphql = (cm, options) => {
      var result = graphqlHint(cm, options);
      resolve(result);
      CodeMirror.hint.graphql = graphqlHint;
      return result;
    };

    editor.doc.setValue(queryString);
    editor.doc.setCursor(cursor);
    editor.execCommand('autocomplete');
  });
}

function checkSuggestions(source, suggestions) {
  var titles = suggestions.map(suggestion => suggestion.text);
  expect(titles).to.deep.equal(source);
}

describe('graphql-hint', () => {
  it('attaches a GraphQL hint function with correct mode/hint options', async () => {
    var editor = await createEditorWithHint();
    expect(
      editor.getHelpers(editor.getCursor(), 'hint')
    ).to.not.have.lengthOf(0);
  });

  it('provides correct initial keywords', async () => {
    var suggestions = await getHintSuggestions('', { line: 0, ch: 0 });
    var initialKeywords = [ 'query', 'mutation', 'subscription', 'fragment', '{' ];
    checkSuggestions(initialKeywords, suggestions.list);
  });

  it('provides correct field name suggestions', async () => {
    var suggestions = await getHintSuggestions('{ ', { line: 0, ch: 2 });
    var fieldConfig = TestSchema.getQueryType().getFields();
    var fieldNames = Object.keys(fieldConfig).concat([ '__schema', '__type' ]);
    checkSuggestions(fieldNames, suggestions.list);
  });

  it('provides correct field name suggestion indentation', async () => {
    var suggestions = await getHintSuggestions('{\n  ', { line: 1, ch: 2 });
    expect(suggestions.from).to.deep.equal({ line: 1, ch: 2 });
    expect(suggestions.to).to.deep.equal({ line: 1, ch: 2 });
  });

  it('provides correct argument suggestions', async () => {
    var suggestions = await getHintSuggestions(
      '{ hasArgs ( ', { line: 0, ch: 12 });
    var argumentNames =
      TestSchema.getQueryType().getFields().hasArgs.args.map(arg => arg.name);
    checkSuggestions(argumentNames, suggestions.list);
  });

  it.only('provides correct argument suggestions when using aliases', async () => {
    var suggestions = await getHintSuggestions(
      '{ aliasTest: hasArgs ( ', { line: 0, ch: 23 });
    var argumentNames =
      TestSchema.getQueryType().getFields().hasArgs.args.map(arg => arg.name);
    checkSuggestions(argumentNames, suggestions.list);
  });

  it('provides correct directive suggestions', async () => {
    var suggestions = await getHintSuggestions(
      '{ test (@', { line: 0, ch: 9 });
    var directiveNames = [ 'include', 'skip' ];
    checkSuggestions(directiveNames, suggestions.list);
  });

  it('provides correct directive suggestions when using aliases', async () => {
    var suggestions = await getHintSuggestions(
      '{ aliasTest: test (@', { line: 0, ch: 20 });
    var directiveNames = [ 'include', 'skip' ];
    checkSuggestions(directiveNames, suggestions.list);
  });

  it('provides correct typeCondition suggestions', async () => {
    var suggestions = await getHintSuggestions(
      '{ union { ... on ', { line: 0, ch: 17 });
    var unionType = TestSchema.getQueryType().getFields().union.type;
    var typeConditionNames =
      TestSchema.getPossibleTypes(unionType).map(type => type.name)
        .concat([ 'TestInterface' ]);
    checkSuggestions(typeConditionNames, suggestions.list);
  });

  it('provides correct typeCondition suggestions on fragment', async () => {
    var suggestions = await getHintSuggestions(
      'fragment Foo on ', { line: 0, ch: 16 });
    var typeMap = TestSchema.getTypeMap();
    var typeConditionNames = Object.keys(typeMap).filter(typeName => {
      var type = typeMap[typeName];
      return isOutputType(type) && !isLeafType(type);
    });
    checkSuggestions(typeConditionNames, suggestions.list);
  });

  it('provides correct ENUM suggestions', async () => {
    var suggestions = await getHintSuggestions(
      '{ hasArgs (enum: ', { line: 0, ch: 17 });
    var enumNames =
      TestSchema.getType('TestEnum').getValues().map(value => value.name);
    checkSuggestions(enumNames, suggestions.list);
  });

  it('provides correct testInput suggestions', async () => {
    var suggestions = await getHintSuggestions(
      '{ hasArgs (object: { ', { line: 0, ch: 21 });
    var testInputNames = Object.keys(TestSchema.getType('TestInput').getFields());
    checkSuggestions(testInputNames, suggestions.list);
  });

  it('provides fragment name suggestion', async () => {
    var suggestions = await getHintSuggestions(
      'fragment Foo on Test { id }  query { ...',
      { line: 0, ch: 40 }
    );
    checkSuggestions([ 'Foo' ], suggestions.list);
  });

  it('provides fragment names for fragments defined lower', async () => {
    var suggestions = await getHintSuggestions(
      'query { ... } fragment Foo on Test { id }',
      { line: 0, ch: 11 }
    );
    checkSuggestions([ 'Foo' ], suggestions.list);
  });

  it('provides only appropriate fragment names', async () => {
    var suggestions = await getHintSuggestions(
      'fragment Foo on TestUnion { ... } ' +
      'fragment Bar on First { name } ' +
      'fragment Baz on Second { name } ' +
      'fragment Qux on TestUnion { name } ' +
      'fragment Nrf on Test { id }',
      { line: 0, ch: 31 }
    );
    checkSuggestions([ 'Bar', 'Baz', 'Qux' ], suggestions.list);
  });

  it('provides correct field name suggestion inside inline fragment', async () => {
    var suggestions = await getHintSuggestions(
      'fragment Foo on TestUnion { ... on First { ',
      { line: 0, ch: 43 }
    );
    var fieldNames = Object.keys(TestSchema.getType('First').getFields());
    checkSuggestions(fieldNames, suggestions.list);
  });

  it('provides correct field name suggestion inside typeless inline fragment', async () => {
    var suggestions = await getHintSuggestions(
      'fragment Foo on First { ... { ',
      { line: 0, ch: 30 }
    );
    var fieldNames = Object.keys(TestSchema.getType('First').getFields());
    checkSuggestions(fieldNames, suggestions.list);
  });
});
