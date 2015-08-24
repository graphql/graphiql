/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import '../hint/graphql-hint';
import { TestSchema } from './testSchema';
import { graphql } from 'graphql';
import { introspectionQuery, buildClientSchema } from 'graphql/utilities';

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
  let editor = await createEditorWithHint();
  return new Promise(resolve => {
    let graphqlHint = CodeMirror.hint.graphql;
    CodeMirror.hint.graphql = (cm, options) => {
      let result = graphqlHint(cm, options);
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

async function getClientSchema() {
  return await graphql(TestSchema, introspectionQuery)
    .then((response) => {
      return buildClientSchema(response.data);
    });
}

function checkSuggestions(source, suggestions) {
  var titles = suggestions
    .map(suggestion => suggestion.text)
    .filter(title => title !== '__schema' && title !== '__type');
  expect(titles).to.deep.equal(source);
}

describe('graphql-hint', () => {
  it('attaches a GraphQL hint function with correct mode/hint options', async () => {
    let editor = await createEditorWithHint();
    expect(
      editor.getHelpers(editor.getCursor(), 'hint')
    ).to.not.have.lengthOf(0);
  });

  it('provides correct initial keywords', async () => {
    let suggestions = await getHintSuggestions('', { line: 0, ch: 0 });
    const initialKeywords = [ 'query', 'mutation', 'fragment', '{' ];
    checkSuggestions(initialKeywords, suggestions.list);
  });

  it('provides correct field name suggestions', async () => {
    let suggestions = await getHintSuggestions('{ ', { line: 0, ch: 2 });
    const fieldConfig = TestSchema.getQueryType().getFields();
    const fieldNames = Object.keys(fieldConfig);
    checkSuggestions(fieldNames, suggestions.list);
  });

  it('provides correct field name suggestion indentation', async () => {
    let suggestions = await getHintSuggestions('{\n  ', { line: 1, ch: 2 });
    expect(suggestions.from).to.deep.equal({ line: 1, ch: 2 });
    expect(suggestions.to).to.deep.equal({ line: 1, ch: 2 });
  });

  it('provides correct argument suggestions', async () => {
    let suggestions = await getHintSuggestions(
      '{ hasArgs ( ', { line: 0, ch: 12 });
    const argumentNames =
      TestSchema.getQueryType().getFields().hasArgs.args.map(arg => arg.name);
    checkSuggestions(argumentNames, suggestions.list);
  });

  it('provides correct directive suggestions', async () => {
    let suggestions = await getHintSuggestions(
      '{ test (@', { line: 0, ch: 9 });
    const directiveNames = [ 'include', 'skip' ];
    checkSuggestions(directiveNames, suggestions.list);
  });

  it('provides correct typeCondition suggestions', async () => {
    let suggestions = await getHintSuggestions(
      '{ union { ... on ', { line: 0, ch: 17 });
    const typeConditionNames =
      TestSchema.getQueryType().getFields().union.type
        .getPossibleTypes().map(type => type.name);
    checkSuggestions(typeConditionNames, suggestions.list);
  });

  it('provides correct ENUM suggestions', async () => {
    let suggestions = await getHintSuggestions(
      '{ hasArgs (enum: ', { line: 0, ch: 17 });
    const enumNames =
      TestSchema.getType('TestEnum').getValues().map(value => value.name);
    checkSuggestions(enumNames, suggestions.list);
  });

  it('provides correct testInput suggestions', async () => {
    let suggestions = await getHintSuggestions(
      '{ hasArgs (object: { ', { line: 0, ch: 21 });
    const testInputNames = Object.keys(TestSchema.getType('TestInput').getFields());
    checkSuggestions(testInputNames, suggestions.list);
  });
});
