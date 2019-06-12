/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import {
  LexRules,
  ParseRules,
  isIgnored,
  onlineParser,
} from 'graphql-language-service-parser';

/**
 * The GraphQL mode is defined as a tokenizer along with a list of rules, each
 * of which is either a function or an array.
 *
 *   * Function: Provided a token and the stream, returns an expected next step.
 *   * Array: A list of steps to take in order.
 *
 * A step is either another rule, or a terminal description of a token. If it
 * is a rule, that rule is pushed onto the stack and the parsing continues from
 * that point.
 *
 * If it is a terminal description, the token is checked against it using a
 * `match` function. If the match is successful, the token is colored and the
 * rule is stepped forward. If the match is unsuccessful, the remainder of the
 * rule is skipped and the previous rule is advanced.
 *
 * This parsing algorithm allows for incremental online parsing within various
 * levels of the syntax tree and results in a structured `state` linked-list
 * which contains the relevant information to produce valuable typeaheads.
 */
CodeMirror.defineMode('graphql', config => {
  const parser = onlineParser({
    eatWhitespace: stream => stream.eatWhile(isIgnored),
    lexRules: LexRules,
    parseRules: ParseRules,
    editorConfig: { tabSize: config.tabSize },
  });

  return {
    config,
    startState: parser.startState,
    token: parser.token,
    indent,
    electricInput: /^\s*[})\]]/,
    fold: 'brace',
    lineComment: '#',
    closeBrackets: {
      pairs: '()[]{}""',
      explode: '()[]{}',
    },
  };
});

function indent(state, textAfter) {
  const levels = state.levels;
  // If there is no stack of levels, use the current level.
  // Otherwise, use the top level, pre-emptively dedenting for close braces.
  const level =
    !levels || levels.length === 0
      ? state.indentLevel
      : levels[levels.length - 1] -
        (this.electricInput.test(textAfter) ? 1 : 0);
  return level * this.config.indentUnit;
}
