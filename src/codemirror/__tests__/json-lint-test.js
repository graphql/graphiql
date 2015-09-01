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
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/lint/lint';
import '../lint/json-lint';

/* eslint-disable max-len */

function createEditorWithLint() {
  return CodeMirror(document.createElement('div'), {
    mode: {
      name: 'javascript',
      json: true
    },
    lint: true
  });
}

function printLintErrors(queryString) {
  var editor = createEditorWithLint();

  return new Promise((resolve, reject) => {
    editor.state.lint.options.onUpdateLinting = (errors) => {
      if (errors && errors[0]) {
        if (!errors[0].message.match('Unexpected EOF')) {
          resolve(errors);
        }
      }
      reject();
    };
    editor.doc.setValue(queryString);
  }).then((errors) => {
    return errors;
  }).catch(() => {
    return [];
  });
}

describe('graphql-lint', () => {

  it('attaches a GraphQL lint function with correct mode/lint options', () => {
    var editor = createEditorWithLint();
    expect(
      editor.getHelpers(editor.getCursor(), 'lint')
    ).to.not.have.lengthOf(0);
  });

  it('catches syntax errors', async () => {
    expect(
      (await printLintErrors(`x`))[0].message
    ).to.contain('Expected { but got x.');
  });

});
