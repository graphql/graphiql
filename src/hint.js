/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import getHintsAtPosition from './utils/getHintsAtPosition';

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
  const results = getHintsAtPosition(
    schema,
    editor.getValue(),
    cur,
    token
  );
  if (results.list && results.list.length > 0) {
    results.from = CodeMirror.Pos(results.from.line, results.from.column);
    results.to = CodeMirror.Pos(results.to.line, results.to.column);
    CodeMirror.signal(editor, 'hasCompletion', editor, results, token);
  }

  return results;
});
