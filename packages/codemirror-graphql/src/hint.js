/**
 *  Copyright (c) 2020 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

import CodeMirror from 'codemirror';
import { getAutocompleteSuggestions } from 'graphql-language-service-interface';
import { Position } from 'graphql-language-service-utils';

/**
 * Registers a "hint" helper for CodeMirror.
 *
 * Using CodeMirror's "hint" addon: https://codemirror.net/demo/complete.html
 * Given an editor, this helper will take the token at the cursor and return a
 * list of suggested tokens.
 *
 * Options:
 *
 *   - schema: GraphQLSchema provides the hinter with positionally relevant info
 *
 * Additional Events:
 *
 *   - hasCompletion (codemirror, data, token) - signaled when the hinter has a
 *     new list of completion suggestions.
 *
 */
CodeMirror.registerHelper('hint', 'graphql', (editor, options) => {
  const schema = options.schema;
  if (!schema) {
    return;
  }

  const cur = editor.getCursor();
  const token = editor.getTokenAt(cur);

  const tokenStart =
    token.type !== null && /"|\w/.test(token.string[0])
      ? token.start
      : token.end;

  const position = new Position(cur.line, tokenStart);

  const rawResults = getAutocompleteSuggestions(
    schema,
    editor.getValue(),
    position,
    token,
  );

  const results = {
    list: rawResults.map(item => ({
      text: item.label,
      type: item.type,
      description: item.documentation,
      isDeprecated: item.isDeprecated,
      deprecationReason: item.deprecationReason,
    })),
    from: { line: cur.line, column: tokenStart },
    to: { line: cur.line, column: token.end },
  };

  if (results && results.list && results.list.length > 0) {
    results.from = CodeMirror.Pos(results.from.line, results.from.column);
    results.to = CodeMirror.Pos(results.to.line, results.to.column);
    CodeMirror.signal(editor, 'hasCompletion', editor, results, token);
  }

  return results;
});
