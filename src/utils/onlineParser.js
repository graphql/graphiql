/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Builds an online immutable parser, designed to be used as part of a syntax
 * highlighting and code intelligence tools.
 *
 * Options:
 *
 *     eatWhitespace: (
 *       stream: Stream | CodeMirror.StringStream | CharacterStream
 *     ) => boolean
 *       Use CodeMirror API.
 *
 *     LexRules: { [name: string]: RegExp }, Includes `Punctuation`.
 *
 *     ParseRules: { [name: string]: Array<Rule> }, Includes `Document`.
 *
 *     editorConfig: { [name: string]: mixed }, Provides an editor-specific
 *       configurations set.
 *
 */

export default function onlineParser(options) {
  return {
    startState() {
      var initialState = { level: 0 };
      pushRule(options.ParseRules, initialState, 'Document');
      return initialState;
    },
    token(stream, state) {
      return getToken(stream, state, options);
    }
  };
}

function getToken(stream, state, options) {
  const { LexRules, ParseRules, eatWhitespace, editorConfig } = options;
  if (state.needsAdvance) {
    state.needsAdvance = false;
    advanceRule(state, true);
  }

  // Remember initial indentation
  if (stream.sol()) {
    const tabSize = editorConfig && editorConfig.tabSize || 2;
    state.indentLevel =
      Math.floor(stream.indentation() / tabSize);
  }

  // Consume spaces and ignored characters
  if (eatWhitespace(stream)) {
    return 'ws';
  }

  // Peek a character forward and skip the entire line if it's a comment line
  if (stream.peek() === '#') {
    stream.skipToEnd();
    return 'comment';
  }

  // Get a matched token from the stream, using lex
  var token = lex(LexRules, stream);

  // If there's no matching token, skip ahead.
  if (!token) {
    stream.match(/\S+/);
    return 'invalidchar';
  }

  // Save state before continuing.
  saveState(state);

  // Handle changes in expected indentation level
  if (token.kind === 'Punctuation') {
    if (/^[{([]/.test(token.value)) {
      // Push on the stack of levels one level deeper than the current level.
      state.levels = (state.levels || []).concat(state.indentLevel + 1);
    } else if (/^[})\]]/.test(token.value)) {
      // Pop from the stack of levels.
      // If the top of the stack is lower than the current level, lower the
      // current level to match.
      var levels = state.levels = (state.levels || []).slice(0, -1);
      if (levels.length > 0 && levels[levels.length - 1] < state.indentLevel) {
        state.indentLevel = levels[levels.length - 1];
      }
    }
  }

  while (state.rule) {
    // If this is a forking rule, determine what rule to use based on
    // the current token, otherwise expect based on the current step.
    var expected =
      typeof state.rule === 'function' ?
        state.step === 0 ? state.rule(token, stream) : null :
        state.rule[state.step];

    // Seperator between list elements if necessary.
    if (state.needsSeperator) {
      expected = expected && expected.separator;
    }

    if (expected) {
      // Un-wrap optional/list ParseRules.
      if (expected.ofRule) {
        expected = expected.ofRule;
      }

      // A string represents a Rule
      if (typeof expected === 'string') {
        pushRule(ParseRules, state, expected);
        continue;
      }

      // Otherwise, match a Terminal.
      if (expected.match && expected.match(token)) {
        if (expected.update) {
          expected.update(state, token);
        }

        // If this token was a punctuator, advance the parse rule, otherwise
        // mark the state to be advanced before the next token. This ensures
        // that tokens which can be appended to keep the appropriate state.
        if (token.kind === 'Punctuation') {
          advanceRule(state, true);
        } else {
          state.needsAdvance = true;
        }

        return expected.style;
      }
    }

    unsuccessful(state);
  }

  // The parser does not know how to interpret this token, do not affect state.
  restoreState(state);
  return 'invalidchar';
}

function assign(to, from) {
  var keys = Object.keys(from);
  for (var i = 0; i < keys.length; i++) {
    to[keys[i]] = from[keys[i]];
  }
  return to;
}

var stateCache = {};

// Save the current state in the cache.
function saveState(state) {
  assign(stateCache, state);
}

// Restore from the state cache.
function restoreState(state) {
  assign(state, stateCache);
}

// Push a new rule onto the state.
function pushRule(ParseRules, state, ruleKind) {
  if (!ParseRules[ruleKind]) {
    throw new TypeError('Unknown rule: ' + ruleKind);
  }
  state.prevState = assign({}, state);
  state.kind = ruleKind;
  state.name = null;
  state.type = null;
  state.rule = ParseRules[ruleKind];
  state.step = 0;
  state.needsSeperator = false;
}

// Pop the current rule from the state.
function popRule(state) {
  state.kind = state.prevState.kind;
  state.name = state.prevState.name;
  state.type = state.prevState.type;
  state.rule = state.prevState.rule;
  state.step = state.prevState.step;
  state.needsSeperator = state.prevState.needsSeperator;
  state.prevState = state.prevState.prevState;
}

// Advance the step of the current rule.
function advanceRule(state, successful) {
  // If this is advancing successfully and the current state is a list, give
  // it an opportunity to repeat itself.
  if (isList(state)) {
    if (state.rule[state.step].separator) {
      state.needsSeperator = !state.needsSeperator;
      // If the next list iteration might accept a non-separator, then give it
      // an opportunity to repeat.
      if (!state.needsSeperator) {
        return;
      }
    }
    // If this was a successful list parse, then allow it to repeat itself.
    if (successful) {
      return;
    }
  }

  // Advance the step in the rule. If the rule is completed, pop
  // the rule and advance the parent rule as well (recursively).
  state.needsSeperator = false;
  state.step++;
  // While the current rule is completed.
  while (
    state.rule &&
    !(Array.isArray(state.rule) && state.step < state.rule.length)
  ) {
    popRule(state);

    if (state.rule) {
      // Do not advance a List step so it has the opportunity to repeat itself.
      if (isList(state)) {
        if (state.rule[state.step].separator) {
          state.needsSeperator = !state.needsSeperator;
        }
      } else {
        state.needsSeperator = false;
        state.step++;
      }
    }
  }
}

function isList(state) {
  return Array.isArray(state.rule) && state.rule[state.step].isList;
}

// Unwind the state after an unsuccessful match.
function unsuccessful(state) {
  // Fall back to the parent rule until you get to an optional or list rule or
  // until the entire stack of rules is empty.
  while (
    state.rule &&
    !(Array.isArray(state.rule) && state.rule[state.step].ofRule)
  ) {
    popRule(state);
  }

  // If there is still a rule, it must be an optional or list rule.
  // Consider this rule a success so that we may move past it.
  if (state.rule) {
    advanceRule(state, false);
  }
}

// Given a stream, returns a { kind, value } pair, or null.
function lex(LexRules, stream) {
  var kinds = Object.keys(LexRules);
  for (var i = 0; i < kinds.length; i++) {
    var match = stream.match(LexRules[kinds[i]]);
    if (match) {
      return { kind: kinds[i], value: match[0] };
    }
  }
}
