/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';


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
  return {
    config,
    token: getToken,
    indent,
    startState() {
      var initialState = { level: 0 };
      pushRule(initialState, 'Document');
      return initialState;
    },
    electricInput: /^\s*[})\]]/,
    fold: 'brace',
    lineComment: '#',
    closeBrackets: {
      pairs: '()[]{}""',
      explode: '()[]{}'
    },
  };
});

function getToken(stream, state) {
  if (state.needsAdvance) {
    state.needsAdvance = false;
    advanceRule(state);
  }

  // Remember initial indentation
  if (stream.sol()) {
    state.indentLevel = Math.floor(stream.indentation() / this.config.tabSize);
  }

  // Consume spaces and ignored characters
  if (stream.eatSpace() || stream.eatWhile(',')) {
    return null;
  }

  // Tokenize line comment
  if (stream.match(this.lineComment)) {
    stream.skipToEnd();
    return 'comment';
  }

  // Lex a token from the stream
  var token = lex(stream);

  // If there's no matching token, skip ahead.
  if (!token) {
    stream.match(/\w+|./);
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

    if (expected) {
      // Un-wrap optional/list ParseRules.
      if (expected.ofRule) {
        expected = expected.ofRule;
      }

      // A string represents a Rule
      if (typeof expected === 'string') {
        pushRule(state, expected);
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
          advanceRule(state);
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

function indent(state, textAfter) {
  var levels = state.levels;
  // If there is no stack of levels, use the current level.
  // Otherwise, use the top level, pre-emptively dedenting for close braces.
  var level = !levels || levels.length === 0 ? state.indentLevel :
    levels[levels.length - 1] - (this.electricInput.test(textAfter) ? 1 : 0);
  return level * this.config.indentUnit;
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
function pushRule(state, ruleKind) {
  state.prevState = assign({}, state);
  state.kind = ruleKind;
  state.name = null;
  state.type = null;
  state.rule = ParseRules[ruleKind];
  state.step = 0;
}

// Pop the current rule from the state.
function popRule(state) {
  state.kind = state.prevState.kind;
  state.name = state.prevState.name;
  state.type = state.prevState.type;
  state.rule = state.prevState.rule;
  state.step = state.prevState.step;
  state.prevState = state.prevState.prevState;
}

// Advance the step of the current rule.
function advanceRule(state) {
  // Advance the step in the rule. If the rule is completed, pop
  // the rule and advance the parent rule as well (recursively).
  state.step++;
  while (
    state.rule &&
    !(Array.isArray(state.rule) && state.step < state.rule.length)
  ) {
    popRule(state);
    // Do not advance a List step so it has the opportunity to repeat itself.
    if (
      state.rule &&
      !(Array.isArray(state.rule) && state.rule[state.step].isList)
    ) {
      state.step++;
    }
  }
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
    advanceRule(state);
  }
}

// Given a stream, returns a { kind, value } pair, or null.
function lex(stream) {
  var kinds = Object.keys(LexRules);
  for (var i = 0; i < kinds.length; i++) {
    var match = stream.match(LexRules[kinds[i]]);
    if (match) {
      return { kind: kinds[i], value: match[0] };
    }
  }
}

// An constraint described as `but not` in the GraphQL spec.
function butNot(rule, exclusions) {
  var ruleMatch = rule.match;
  rule.match =
    token => ruleMatch(token) &&
    exclusions.every(exclusion => !exclusion.match(token));
  return rule;
}

// An optional rule.
function opt(ofRule) {
  return { ofRule };
}

// A list of another rule.
function list(ofRule) {
  return { ofRule, isList: true };
}

// Token of a kind
function t(kind, style) {
  return { style, match: token => token.kind === kind };
}

// Punctuator
function p(value, style) {
  return {
    style: style || 'punctuation',
    match: token => token.kind === 'Punctuation' && token.value === value
  };
}

// A keyword Token
function word(value) {
  return {
    style: 'keyword',
    match: token => token.kind === 'Name' && token.value === value
  };
}

// A Name Token which will decorate the state with a `name`
function name(style) {
  return {
    style,
    match: token => token.kind === 'Name',
    update(state, token) {
      state.name = token.value;
    }
  };
}

// A Name Token which will decorate the previous state with a `type`
function type(style) {
  return {
    style,
    match: token => token.kind === 'Name',
    update(state, token) {
      state.prevState.type = token.value;
    }
  };
}

/**
 * The lexer rules. These are exactly as described by the spec.
 */
var LexRules = {
  // The Name token.
  Name: /^[_A-Za-z][_0-9A-Za-z]*/,

  // All Punctuation used in GraphQL
  Punctuation: /^(?:!|\$|\(|\)|\.\.\.|:|=|@|\[|\]|\{|\})/,

  // Combines the IntValue and FloatValue tokens.
  Number: /^-?(?:0|(?:[1-9][0-9]*))(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?/,

  // Note the closing quote is made optional as an IDE experience improvment.
  String: /^"(?:[^"\\]|\\(?:b|f|n|r|t|u[0-9a-fA-F]{4}))*"?/,
};

/**
 * The parser rules. These are very close to, but not exactly the same as the
 * spec. Minor deviations allow for a simpler implementation. The resulting
 * parser can parse everything the spec declares possible.
 */
var ParseRules = {
  Document: [ list('Definition') ],
  Definition(token) {
    switch (token.value) {
      case 'query': return 'Query';
      case 'mutation': return 'Mutation';
      case 'subscription': return 'Subscription';
      case 'fragment': return 'FragmentDefinition';
      case '{': return 'ShortQuery';
    }
  },
  // Note: instead of "Operation", these rules have been separated out.
  Query: [
    word('query'),
    opt(name('def')),
    opt('VariableDefinitions'),
    list('Directive'),
    'SelectionSet'
  ],
  ShortQuery: [ 'SelectionSet' ],
  Mutation: [
    word('mutation'),
    opt(name('def')),
    opt('VariableDefinitions'),
    list('Directive'),
    'SelectionSet'
  ],
  Subscription: [
    word('subscription'),
    opt(name('def')),
    opt('VariableDefinitions'),
    list('Directive'),
    'SelectionSet'
  ],
  VariableDefinitions: [ p('('), list('VariableDefinition'), p(')') ],
  VariableDefinition: [ 'Variable', p(':'), 'Type', opt('DefaultValue') ],
  Variable: [ p('$', 'variable'), name('variable') ],
  DefaultValue: [ p('='), 'Value' ],
  SelectionSet: [ p('{'), list('Selection'), p('}') ],
  Selection(token, stream) {
    return token.value === '...' ?
      stream.match(/[\s\u00a0,]*(on\b|@|{)/, false) ?
        'InlineFragment' : 'FragmentSpread' :
      stream.match(/[\s\u00a0,]*:/, false) ? 'AliasedField' : 'Field';
  },
  // Note: this minor deviation of "AliasedField" simplifies the lookahead.
  AliasedField: [ name('qualifier'), p(':'), 'Field' ],
  Field: [
    name('property'), opt('Arguments'), list('Directive'), opt('SelectionSet')
  ],
  Arguments: [ p('('), list('Argument'), p(')') ],
  Argument: [ name('attribute'), p(':'), 'Value' ],
  FragmentSpread: [ p('...'), name('def'), list('Directive') ],
  InlineFragment: [
    p('...'),
    opt('TypeCondition'),
    list('Directive'),
    'SelectionSet'
  ],
  FragmentDefinition: [
    word('fragment'),
    opt(butNot(name('def'), [ word('on') ])),
    'TypeCondition',
    list('Directive'),
    'SelectionSet'
  ],
  TypeCondition: [
    word('on'),
    type('atom'),
  ],
  // Variables could be parsed in cases where only Const is expected by spec.
  Value(token) {
    switch (token.kind) {
      case 'Number': return 'NumberValue';
      case 'String': return 'StringValue';
      case 'Punctuation':
        switch (token.value) {
          case '[': return 'ListValue';
          case '{': return 'ObjectValue';
          case '$': return 'Variable';
        }
        return null;
      case 'Name':
        switch (token.value) {
          case 'true': case 'false': return 'BooleanValue';
        }
        return 'EnumValue';
    }
  },
  NumberValue: [ t('Number', 'number') ],
  StringValue: [ t('String', 'string') ],
  BooleanValue: [ t('Name', 'builtin') ],
  EnumValue: [ name('string-2') ],
  ListValue: [ p('['), list('Value'), p(']') ],
  ObjectValue: [ p('{'), list('ObjectField'), p('}') ],
  ObjectField: [ name('attribute'), p(':'), 'Value' ],
  Type(token) {
    return token.value === '[' ? 'ListType' : 'NamedType';
  },
  // NonNullType has been merged into ListType and NamedType to simplify.
  ListType: [ p('['), 'NamedType', p(']'), opt(p('!')) ],
  NamedType: [ name('atom'), opt(p('!')) ],
  Directive: [ p('@', 'meta'), name('meta'), opt('Arguments') ],
};
