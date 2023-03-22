/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
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
 *     LexRules: { [name: string]: RegExp }, Includes `Punctuation`, `Comment`.
 *
 *     ParseRules: { [name: string]: Array<Rule> }, Includes `Document`.
 *
 *     editorConfig: { [name: string]: any }, Provides an editor-specific
 *       configurations set.
 *
 */

import CharacterStream from './CharacterStream';
import { State, Token, Rule, RuleKind } from './types';

import { LexRules, ParseRules, isIgnored } from './Rules';
import { Kind } from 'graphql';

export type ParserOptions = {
  eatWhitespace: (stream: CharacterStream) => boolean;
  lexRules: Partial<typeof LexRules>;
  parseRules: typeof ParseRules;
  editorConfig: { [name: string]: any };
};

export default function onlineParser(
  options: ParserOptions = {
    eatWhitespace: stream => stream.eatWhile(isIgnored),
    lexRules: LexRules,
    parseRules: ParseRules,
    editorConfig: {},
  },
): {
  startState: () => State;
  token: (stream: CharacterStream, state: State) => string;
} {
  return {
    startState() {
      const initialState = {
        level: 0,
        step: 0,
        name: null,
        kind: null,
        type: null,
        rule: null,
        needsSeparator: false,
        prevState: null,
      };

      pushRule(options.parseRules, initialState, Kind.DOCUMENT);
      return initialState;
    },
    token(stream: CharacterStream, state: State) {
      return getToken(stream, state, options);
    },
  };
}

function getToken(
  stream: CharacterStream,
  state: State,
  options: ParserOptions,
): string {
  if (state.inBlockstring) {
    // eslint-disable-next-line unicorn/prefer-regexp-test -- false positive stream is not string
    if (stream.match(/.*"""/)) {
      state.inBlockstring = false;
      return 'string';
    }
    stream.skipToEnd();
    return 'string';
  }

  const { lexRules, parseRules, eatWhitespace, editorConfig } = options;
  // Restore state after an empty-rule.
  if (state.rule && state.rule.length === 0) {
    popRule(state);
  } else if (state.needsAdvance) {
    state.needsAdvance = false;
    advanceRule(state, true);
  }

  // Remember initial indentation
  if (stream.sol()) {
    const tabSize = editorConfig?.tabSize || 2;
    state.indentLevel = Math.floor(stream.indentation() / tabSize);
  }

  // Consume spaces and ignored characters
  if (eatWhitespace(stream)) {
    return 'ws';
  }

  // Get a matched token from the stream, using lex
  const token = lex(lexRules, stream);

  // If there's no matching token, skip ahead.
  if (!token) {
    const matchedSomething = stream.match(/\S+/);
    if (!matchedSomething) {
      // We need to eat at least one character, and we couldn't match any
      // non-whitespace, so it must be exotic whitespace.
      stream.match(/\s/);
    }
    pushRule(SpecialParseRules, state, 'Invalid');
    return 'invalidchar';
  }

  // If the next token is a Comment, insert a Comment parsing rule.
  if (token.kind === 'Comment') {
    pushRule(SpecialParseRules, state, 'Comment');
    return 'comment';
  }

  // Save state before continuing.
  const backupState = assign({}, state);

  // Handle changes in expected indentation level
  if (token.kind === 'Punctuation') {
    if (/^[{([]/.test(token.value)) {
      if (state.indentLevel !== undefined) {
        // Push on the stack of levels one level deeper than the current level.
        state.levels = (state.levels || []).concat(state.indentLevel + 1);
      }
    } else if (/^[})\]]/.test(token.value)) {
      // Pop from the stack of levels.
      // If the top of the stack is lower than the current level, lower the
      // current level to match.
      const levels = (state.levels = (state.levels || []).slice(0, -1));
      // FIXME
      // what if state.indentLevel === 0?
      if (
        state.indentLevel &&
        levels.length > 0 &&
        levels.at(-1)! < state.indentLevel
      ) {
        state.indentLevel = levels.at(-1);
      }
    }
  }

  while (state.rule) {
    // If this is a forking rule, determine what rule to use based on
    // the current token, otherwise expect based on the current step.
    let expected: any =
      typeof state.rule === 'function'
        ? state.step === 0
          ? state.rule(token, stream)
          : null
        : state.rule[state.step];

    // Separator between list elements if necessary.
    if (state.needsSeparator) {
      expected = expected?.separator;
    }

    if (expected) {
      // Un-wrap optional/list parseRules.
      if (expected.ofRule) {
        expected = expected.ofRule;
      }

      // A string represents a Rule
      if (typeof expected === 'string') {
        pushRule(parseRules, state, expected as RuleKind);
        continue;
      }

      // Otherwise, match a Terminal.
      if (expected.match?.(token)) {
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
  assign(state, backupState);
  pushRule(SpecialParseRules, state, 'Invalid');
  return 'invalidchar';
}

// Utility function to assign from object to another object.
function assign(to: Object, from: Object): Object {
  const keys = Object.keys(from);
  for (let i = 0; i < keys.length; i++) {
    // @ts-ignore
    // TODO: ParseRules as numerical index
    to[keys[i]] = from[keys[i]];
  }
  return to;
}

// A special rule set for parsing comment tokens.
const SpecialParseRules = {
  Invalid: [],
  Comment: [],
};

// Push a new rule onto the state.
function pushRule(
  rules: typeof ParseRules,
  state: State,
  ruleKind: RuleKind,
): void {
  if (!rules[ruleKind]) {
    throw new TypeError('Unknown rule: ' + ruleKind);
  }
  state.prevState = { ...state };
  state.kind = ruleKind;
  state.name = null;
  state.type = null;
  state.rule = rules[ruleKind];
  state.step = 0;
  state.needsSeparator = false;
}

// Pop the current rule from the state.
function popRule(state: State): undefined {
  // Check if there's anything to pop
  if (!state.prevState) {
    return;
  }
  state.kind = state.prevState.kind;
  state.name = state.prevState.name;
  state.type = state.prevState.type;
  state.rule = state.prevState.rule;
  state.step = state.prevState.step;
  state.needsSeparator = state.prevState.needsSeparator;
  state.prevState = state.prevState.prevState;
}

// Advance the step of the current rule.
function advanceRule(state: State, successful: boolean): undefined {
  // If this is advancing successfully and the current state is a list, give
  // it an opportunity to repeat itself.
  if (isList(state) && state.rule) {
    // @ts-ignore
    // TODO: ParseRules as numerical index
    const step = state.rule[state.step];
    if (step.separator) {
      const { separator } = step;
      state.needsSeparator = !state.needsSeparator;
      // If the separator was optional, then give it an opportunity to repeat.
      if (!state.needsSeparator && separator.ofRule) {
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
  state.needsSeparator = false;
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
        // @ts-ignore
        // TODO: ParseRules as numerical index
        if (state.rule?.[state.step].separator) {
          state.needsSeparator = !state.needsSeparator;
        }
      } else {
        state.needsSeparator = false;
        state.step++;
      }
    }
  }
}

function isList(state: State): boolean | null | undefined {
  const step =
    Array.isArray(state.rule) &&
    typeof state.rule[state.step] !== 'string' &&
    (state.rule[state.step] as Rule);
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- otherwise has type issue
  return step && step.isList;
}

// Unwind the state after an unsuccessful match.
function unsuccessful(state: State): void {
  // Fall back to the parent rule until you get to an optional or list rule or
  // until the entire stack of rules is empty.
  while (
    state.rule &&
    // TODO: not sure how to fix this in a performant way
    // @ts-ignore
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
function lex(
  lexRules: Partial<typeof LexRules>,
  stream: CharacterStream,
): Token | null | undefined {
  const kinds = Object.keys(lexRules);
  for (let i = 0; i < kinds.length; i++) {
    // @ts-ignore
    // TODO: ParseRules as numerical index
    const match = stream.match(lexRules[kinds[i]]);
    if (match && match instanceof Array) {
      return { kind: kinds[i], value: match[0] };
    }
  }
}
