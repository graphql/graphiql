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
import '../hint';
import { TestSchema } from './testSchema';
import { graphql } from 'graphql';
import { introspectionQuery, buildClientSchema } from 'graphql/utilities';
import { isOutputType, isLeafType } from 'graphql/type';

/* eslint-disable max-len */

async function createEditorWithHint() {
  return CodeMirror(document.createElement('div'), {
    mode: 'graphql',
    hintOptions: {
      schema: await getClientSchema(),
      closeOnUnfocus: false,
      completeSingle: false
    }
  });
}

async function getHintSuggestions(queryString, cursor) {
  var editor = await createEditorWithHint();
  return new Promise(resolve => {
    var graphqlHint = CodeMirror.hint.graphql;
    CodeMirror.hint.graphql = (cm, options) => {
      var result = graphqlHint(cm, options);
      if (result) {
        resolve(result);
      }

      return result;
    };

    editor.doc.setValue(queryString);
    editor.doc.setCursor(cursor);
    editor.execCommand('autocomplete');
  });
}

function getClientSchema() {
  return graphql(TestSchema, introspectionQuery)
    .then(response => buildClientSchema(response.data));
}

function checkSuggestions(source, suggestions) {
  var titles = suggestions
    .map(suggestion => suggestion.text)
    .filter(title => title !== '__schema' && title !== '__type');
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
    var initialKeywords = [ 'query', 'mutation', 'fragment', '{' ];
    checkSuggestions(initialKeywords, suggestions.list);
  });

  it('provides correct field name suggestions', async () => {
    var suggestions = await getHintSuggestions('{ ', { line: 0, ch: 2 });
    var fieldConfig = TestSchema.getQueryType().getFields();
    var fieldNames = Object.keys(fieldConfig);
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

  it('provides correct directive suggestions', async () => {
    var suggestions = await getHintSuggestions(
      '{ test (@', { line: 0, ch: 9 });
    var directiveNames = [ 'include', 'skip' ];
    checkSuggestions(directiveNames, suggestions.list);
  });

  it('provides correct typeCondition suggestions', async () => {
    var suggestions = await getHintSuggestions(
      '{ union { ... on ', { line: 0, ch: 17 });
    var typeConditionNames =
      TestSchema.getQueryType().getFields().union.type
        .getPossibleTypes().map(type => type.name);
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
});
