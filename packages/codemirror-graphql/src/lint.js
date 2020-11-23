/**
 *  Copyright (c) 2020 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import { getDiagnostics } from 'graphql-language-service-interface';

const SEVERITY = ['error', 'warning', 'information', 'hint'];
const TYPE = {
  'GraphQL: Validation': 'validation',
  'GraphQL: Deprecation': 'deprecation',
  'GraphQL: Syntax': 'syntax',
};

/**
 * Registers a "lint" helper for CodeMirror.
 *
 * Using CodeMirror's "lint" addon: https://codemirror.net/demo/lint.html
 * Given the text within an editor, this helper will take that text and return
 * a list of linter issues, derived from GraphQL's parse and validate steps.
 * Also, this uses `graphql-language-service-parser` to power the diagnostics
 * service.
 *
 * Options:
 *
 *   - schema: GraphQLSchema provides the linter with positionally relevant info
 *
 */
CodeMirror.registerHelper('lint', 'graphql', (text, options) => {
  const schema = options.schema;
  const rawResults = getDiagnostics(text, schema);

  const results = rawResults.map(error => ({
    message: error.message,
    severity: SEVERITY[error.severity - 1],
    type: TYPE[error.source],
    from: CodeMirror.Pos(error.range.start.line, error.range.start.character),
    to: CodeMirror.Pos(error.range.end.line, error.range.end.character),
  }));

  return results;
});
