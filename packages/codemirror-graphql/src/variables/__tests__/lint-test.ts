/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import 'codemirror/addon/lint/lint';
import { parse } from 'graphql';
import { Maybe } from 'graphql-language-service';
import collectVariables from '../../utils/collectVariables';
import { TestSchema } from '../../__tests__/testSchema';
import '../lint';
import '../mode';

function createEditorWithLint(lintConfig?: any) {
  return CodeMirror(document.createElement('div'), {
    mode: 'graphql-variables',
    lint: lintConfig ? lintConfig : true,
  });
}

function printLintErrors(query: Maybe<string>, variables: string) {
  const editor = createEditorWithLint({
    variableToType: query && collectVariables(TestSchema, parse(query)),
  });

  return new Promise<CodeMirror.Annotation[]>(resolve => {
    editor.state.lint.options.onUpdateLinting = (
      errors: CodeMirror.Annotation[],
    ) => {
      if (errors?.[0]) {
        if (!errors[0].message?.match('Unexpected EOF')) {
          resolve(errors);
        }
      }
      resolve([]);
    };
    editor.doc.setValue(variables);
  });
}

describe('graphql-variables-lint', () => {
  it('attaches a GraphQL lint function with correct mode/lint options', () => {
    const editor = createEditorWithLint();
    expect(editor.getHelpers(editor.getCursor(), 'lint')).not.toHaveLength(0);
  });

  it('catches syntax errors', async () => {
    expect((await printLintErrors(null, '{ foo: "bar" }'))[0].message).toBe(
      'Expected String but found `foo`.',
    );
  });

  it('catches type validation errors', async () => {
    const errors = await printLintErrors(
      'query ($foo: Int) { f }',
      ' { "foo": "NaN" }',
    );

    expect(errors[0]).toEqual({
      message: 'Expected value of type "Int".',
      severity: 'error',
      type: 'validation',
      from: { line: 0, ch: 10, sticky: null },
      to: { line: 0, ch: 15, sticky: null },
    });
  });

  it('reports unknown variable names', async () => {
    const errors = await printLintErrors(
      'query ($foo: Int) { f }',
      ' { "food": "NaN" }',
    );

    expect(errors[0]).toEqual({
      message: 'Variable "$food" does not appear in any GraphQL query.',
      severity: 'error',
      type: 'validation',
      from: { line: 0, ch: 3, sticky: null },
      to: { line: 0, ch: 9, sticky: null },
    });
  });

  it('reports nothing when not configured', async () => {
    const errors = await printLintErrors(null, ' { "foo": "NaN" }');
    expect(errors.length).toBe(0);
  });
});
