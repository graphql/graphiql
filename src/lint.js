/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import { parse, validate, findDeprecatedUsages } from 'graphql';


/**
 * Registers a "lint" helper for CodeMirror.
 *
 * Using CodeMirror's "lint" addon: https://codemirror.net/demo/lint.html
 * Given the text within an editor, this helper will take that text and return
 * a list of linter issues, derived from GraphQL's parse and validate steps.
 *
 * Options:
 *
 *   - schema: GraphQLSchema provides the linter with positionally relevant info
 *
 */
CodeMirror.registerHelper('lint', 'graphql', (text, options, editor) => {
  const schema = options.schema;
  if (!schema) {
    return [];
  }

  try {
    const ast = parse(text);
    const validationErrorAnnotations = mapCat(
      validate(schema, ast),
      error => annotations(editor, error, 'error', 'validation')
    );
    // Note: findDeprecatedUsages was added in graphql@0.9.0, but we want to
    // support older versions of graphql-js.
    const deprecationWarningAnnotations = !findDeprecatedUsages ? [] : mapCat(
      findDeprecatedUsages(schema, ast),
      error => annotations(editor, error, 'warning', 'deprecation')
    );
    return validationErrorAnnotations.concat(deprecationWarningAnnotations);
  } catch (error) {
    const location = error.locations[0];
    const pos = CodeMirror.Pos(location.line - 1, location.column);
    const token = editor.getTokenAt(pos);
    return [ {
      message: error.message,
      severity: 'error',
      type: 'syntax',
      from: CodeMirror.Pos(location.line - 1, token.start),
      to: CodeMirror.Pos(location.line - 1, token.end),
    } ];
  }
});

function annotations(editor, error, severity, type) {
  return error.nodes.map(node => {
    const highlightNode =
      node.kind !== 'Variable' && node.name ? node.name :
      node.variable ? node.variable :
      node;
    return {
      message: error.message,
      severity,
      type,
      from: editor.posFromIndex(highlightNode.loc.start),
      to: editor.posFromIndex(highlightNode.loc.end),
    };
  });
}

// General utility for map-cating (aka flat-mapping).
function mapCat<T>(array: Array<T>, mapper: (item: T) => Array<T>): Array<T> {
  return Array.prototype.concat.apply([], array.map(mapper));
}
