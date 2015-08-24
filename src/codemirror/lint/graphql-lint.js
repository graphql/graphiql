/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import { parse } from 'graphql/language';
import { validate } from 'graphql/validation';


CodeMirror.registerHelper('lint', 'graphql', function (text, options, editor) {
  var schema = options.schema;
  try {
    var ast = parse(text);
  } catch (error) {
    var location = error.locations[0];
    var pos = CodeMirror.Pos(location.line - 1, location.column);
    var token = editor.getTokenAt(pos);
    return [ {
      message: error.message,
      severity: 'error',
      type: 'syntax',
      from: CodeMirror.Pos(location.line - 1, token.start),
      to: CodeMirror.Pos(location.line - 1, token.end),
    } ];
  }
  var errors = schema ? validate(schema, ast) : [];
  return flatMap(errors, error => errorAnnotations(editor, error));
});

function errorAnnotations(editor, error) {
  return error.nodes.map(node => {
    var highlightNode =
      node.kind !== 'Variable' && node.name ? node.name :
      node.variable ? node.variable :
      node;
    return {
      message: error.message,
      severity: 'error',
      type: 'validation',
      from: editor.posFromIndex(highlightNode.loc.start),
      to: editor.posFromIndex(highlightNode.loc.end),
    };
  });
}

// General utility for flat-mapping.
function flatMap<T>(array: Array<T>, mapper: (item: T) => Array<T>): Array<T> {
  return Reflect.apply(Array.prototype.concat, [], array.map(mapper));
}
