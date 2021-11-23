/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import { FragmentDefinitionNode, GraphQLSchema, ValidationRule } from 'graphql';
import { getDiagnostics } from 'graphql-language-service';

const SEVERITY = ['error', 'warning', 'information', 'hint'];
const TYPE: Record<string, string> = {
  'GraphQL: Validation': 'validation',
  'GraphQL: Deprecation': 'deprecation',
  'GraphQL: Syntax': 'syntax',
};

interface GraphQLLintOptions {
  schema?: GraphQLSchema;
  validationRules: ValidationRule[];
  externalFragments?: string | FragmentDefinitionNode[];
}

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
CodeMirror.registerHelper(
  'lint',
  'graphql',
  (text: string, options: GraphQLLintOptions): CodeMirror.Annotation[] => {
    const schema = options.schema;
    const rawResults = getDiagnostics(
      text,
      schema,
      options.validationRules,
      undefined,
      options.externalFragments,
    );

    const results = rawResults.map(error => ({
      message: error.message,
      severity: error.severity ? SEVERITY[error.severity - 1] : SEVERITY[0],
      type: error.source ? TYPE[error.source] : undefined,
      from: CodeMirror.Pos(error.range.start.line, error.range.start.character),
      to: CodeMirror.Pos(error.range.end.line, error.range.end.character),
    }));

    return results;
  },
);
