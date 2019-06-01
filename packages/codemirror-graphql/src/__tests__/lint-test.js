/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {expect} from 'chai';
import {describe, it} from 'mocha';
import CodeMirror from 'codemirror';
import 'codemirror/addon/lint/lint';
import '../lint';
import {TestSchema} from './testSchema';
import {readFileSync} from 'fs';
import {join} from 'path';

/* eslint-disable max-len */

function createEditorWithLint(lintConfig) {
  return CodeMirror(document.createElement('div'), {
    mode: 'graphql',
    lint: lintConfig ? lintConfig : true,
  });
}

function printLintErrors(queryString) {
  const editor = createEditorWithLint({
    schema: TestSchema,
  });

  return new Promise(resolve => {
    editor.state.lint.options.onUpdateLinting = errors => {
      if (errors && errors[0]) {
        if (!errors[0].message.match('Unexpected EOF')) {
          resolve(errors);
        }
      }
      resolve([]);
    };
    editor.doc.setValue(queryString);
  });
}

describe('graphql-lint', () => {
  it('attaches a GraphQL lint function with correct mode/lint options', () => {
    const editor = createEditorWithLint();
    expect(editor.getHelpers(editor.getCursor(), 'lint')).to.not.have.lengthOf(
      0,
    );
  });

  const kitchenSink = readFileSync(join(__dirname, '/kitchen-sink.graphql'), {
    encoding: 'utf8',
  });

  it('returns no syntactic/validation errors after parsing kitchen-sink query', async () => {
    const errors = await printLintErrors(kitchenSink);
    expect(errors).to.have.lengthOf(0);
  });
});
