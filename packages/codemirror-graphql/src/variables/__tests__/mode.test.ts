/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import 'codemirror/addon/runmode/runmode';
import '../mode';

describe('graphql-variables-mode', () => {
  it('provides correct tokens and styles after parsing', () => {
    const queryStr =
      '{ "variable": { "field": "value" }, "list": [ 1, true, null ] }';
    const tokens: [string, string][] = [];

    CodeMirror.runMode(queryStr, 'graphql-variables', (token, style) => {
      if (style && style !== 'ws') {
        tokens.push([token, style]);
      }
    });

    expect(tokens).toEqual([
      ['{', 'punctuation'],
      ['"variable"', 'variable'],
      [':', 'punctuation'],
      ['{', 'punctuation'],
      ['"field"', 'attribute'],
      [':', 'punctuation'],
      ['"value"', 'string'],
      ['}', 'punctuation'],
      [',', 'punctuation'],
      ['"list"', 'variable'],
      [':', 'punctuation'],
      ['[', 'punctuation'],
      ['1', 'number'],
      [',', 'punctuation'],
      ['true', 'builtin'],
      [',', 'punctuation'],
      ['null', 'keyword'],
      [']', 'punctuation'],
      ['}', 'punctuation'],
    ]);
  });

  it('is resilient to missing commas', () => {
    const queryStr =
      '{ "variable": { "field": "value" } "list": [ 1 true null ] }';
    const tokens: [string, string][] = [];

    CodeMirror.runMode(queryStr, 'graphql-variables', (token, style) => {
      if (style && style !== 'ws') {
        tokens.push([token, style]);
      }
    });

    expect(tokens).toEqual([
      ['{', 'punctuation'],
      ['"variable"', 'variable'],
      [':', 'punctuation'],
      ['{', 'punctuation'],
      ['"field"', 'attribute'],
      [':', 'punctuation'],
      ['"value"', 'string'],
      ['}', 'punctuation'],
      ['"list"', 'variable'],
      [':', 'punctuation'],
      ['[', 'punctuation'],
      ['1', 'number'],
      ['true', 'builtin'],
      ['null', 'keyword'],
      [']', 'punctuation'],
      ['}', 'punctuation'],
    ]);
  });

  it('returns "invalidchar" message when there is no matching token', () => {
    CodeMirror.runMode('nope', 'graphql-variables', (token, style) => {
      if (token.trim()) {
        expect(style).toBe('invalidchar');
      }
    });

    CodeMirror.runMode('{ foo', 'graphql-variables', (token, style) => {
      if (token === 'foo') {
        expect(style).toBe('invalidchar');
      }
    });
  });
});
