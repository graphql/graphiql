/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import { GraphQLEnumType, GraphQLInputObjectType, parse } from 'graphql';
import { IHint, IHints } from '../../hint';
import collectVariables from '../../utils/collectVariables';
import { TestSchema } from '../../__tests__/testSchema';
import '../hint';
import '../mode';

function createEditorWithHint(query: string) {
  return CodeMirror(document.createElement('div'), {
    mode: 'graphql-variables',
    hintOptions: {
      variableToType: query && collectVariables(TestSchema, parse(query)),
      closeOnUnfocus: false,
      completeSingle: false,
    },
  });
}

function getHintSuggestions(
  query: string,
  variables: string,
  cursor: CodeMirror.Position,
) {
  const editor = createEditorWithHint(query);
  return new Promise<IHints | undefined>(resolve => {
    const graphqlVariablesHint = CodeMirror.hint['graphql-variables'];
    CodeMirror.hint['graphql-variables'] = (cm, options) => {
      const result = graphqlVariablesHint(cm, options);
      resolve(result);
      CodeMirror.hint['graphql-variables'] = graphqlVariablesHint;
      return result;
    };

    editor.doc.setValue(variables);
    editor.doc.setCursor(cursor);
    editor.execCommand('autocomplete');
  });
}

function checkSuggestions(source: string[], suggestions?: IHint[]) {
  const titles = suggestions?.map(suggestion => suggestion.text);
  expect(titles).toEqual(source);
}

describe('graphql-variables-hint', () => {
  it('attaches a GraphQL hint function with correct mode/hint options', () => {
    const editor = createEditorWithHint('{ f }');
    expect(editor.getHelpers(editor.getCursor(), 'hint')).not.toHaveLength(0);
  });

  it('provides correct initial token', async () => {
    const suggestions = await getHintSuggestions('', '', { line: 0, ch: 0 });
    const initialKeywords = ['{'];
    checkSuggestions(initialKeywords, suggestions?.list);
  });

  it('provides correct field name suggestions', async () => {
    const suggestions = await getHintSuggestions(
      'query ($foo: String!, $bar: Int) { f }',
      '{ ',
      { line: 0, ch: 2 },
    );
    checkSuggestions(['"foo": ', '"bar": '], suggestions?.list);
  });

  it('provides correct variable suggestion indentation', async () => {
    const suggestions = await getHintSuggestions(
      'query ($foo: String!, $bar: Int) { f }',
      '{\n  ',
      { line: 1, ch: 2 },
    );
    expect(suggestions?.from).toEqual({ line: 1, ch: 2, sticky: null });
    expect(suggestions?.to).toEqual({ line: 1, ch: 2, sticky: null });
  });

  it('provides correct variable completion', async () => {
    const suggestions = await getHintSuggestions(
      'query ($foo: String!, $bar: Int) { f }',
      '{\n  ba',
      { line: 1, ch: 4 },
    );
    checkSuggestions(['"bar": '], suggestions?.list);
    expect(suggestions?.from).toEqual({ line: 1, ch: 2, sticky: null });
    expect(suggestions?.to).toEqual({ line: 1, ch: 4, sticky: null });
  });

  it('provides correct variable completion with open quote', async () => {
    const suggestions = await getHintSuggestions(
      'query ($foo: String!, $bar: Int) { f }',
      '{\n  "',
      { line: 1, ch: 4 },
    );
    checkSuggestions(['"foo": ', '"bar": '], suggestions?.list);
    expect(suggestions?.from).toEqual({ line: 1, ch: 2, sticky: null });
    expect(suggestions?.to).toEqual({ line: 1, ch: 3, sticky: null });
  });

  it('provides correct Enum suggestions', async () => {
    const suggestions = await getHintSuggestions(
      'query ($myEnum: TestEnum) { f }',
      '{\n  "myEnum": ',
      { line: 1, ch: 12 },
    );
    const TestEnum = TestSchema.getType('TestEnum');
    checkSuggestions(
      (TestEnum as GraphQLEnumType)
        ?.getValues()
        .map(value => `"${value.name}"`),
      suggestions?.list,
    );
  });

  it('suggests to open an Input Object', async () => {
    const suggestions = await getHintSuggestions(
      'query ($myInput: TestInput) { f }',
      '{\n  "myInput": ',
      { line: 1, ch: 13 },
    );
    checkSuggestions(['{'], suggestions?.list);
  });

  it('provides Input Object fields', async () => {
    const suggestions = await getHintSuggestions(
      'query ($myInput: TestInput) { f }',
      '{\n  "myInput": {\n    ',
      { line: 2, ch: 4 },
    );
    const TestInput = TestSchema.getType('TestInput');
    checkSuggestions(
      Object.keys((TestInput as GraphQLInputObjectType).getFields()).map(
        name => `"${name}": `,
      ),
      suggestions?.list,
    );
    expect(suggestions?.from).toEqual({ line: 2, ch: 4, sticky: null });
    expect(suggestions?.to).toEqual({ line: 2, ch: 4, sticky: null });
  });

  it('provides correct Input Object field completion', async () => {
    const suggestions = await getHintSuggestions(
      'query ($myInput: TestInput) { f }',
      '{\n  "myInput": {\n    bool',
      { line: 2, ch: 8 },
    );
    checkSuggestions(['"boolean": ', '"listBoolean": '], suggestions?.list);
    expect(suggestions?.from).toEqual({ line: 2, ch: 4, sticky: null });
    expect(suggestions?.to).toEqual({ line: 2, ch: 8, sticky: null });
  });

  it('provides correct Input Object field value completion', async () => {
    const suggestions = await getHintSuggestions(
      'query ($myInput: TestInput) { f }',
      '{\n  "myInput": {\n    "boolean": ',
      { line: 2, ch: 15 },
    );
    checkSuggestions(['true', 'false'], suggestions?.list);
  });
});
