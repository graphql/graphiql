/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import onlineParser, { opt, list, butNot, t, p } from './utils/onlineParser';


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
    LexRules,
    ParseRules
  });

  return {
    config,
    startState: parser.startState,
    token: parser.getToken,
    indent,
    electricInput: /^\s*[})\]]/,
    fold: 'brace',
    lineComment: '#',
    closeBrackets: {
      pairs: '()[]{}""',
      explode: '()[]{}'
    },
  };
});

const isIgnored = ch =>
  ch === ' ' ||
  ch === '\t' ||
  ch === ',' ||
  ch === '\n' ||
  ch === '\r' ||
  ch === '\uFEFF';

function indent(state, textAfter) {
  var levels = state.levels;
  // If there is no stack of levels, use the current level.
  // Otherwise, use the top level, pre-emptively dedenting for close braces.
  var level = !levels || levels.length === 0 ? state.indentLevel :
    levels[levels.length - 1] - (this.electricInput.test(textAfter) ? 1 : 0);
  return level * this.config.indentUnit;
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

// A keyword Token.
function word(value) {
  return {
    style: 'keyword',
    match: token => token.kind === 'Name' && token.value === value
  };
}

// A Name Token which will decorate the state with a `name`.
function name(style) {
  return {
    style,
    match: token => token.kind === 'Name',
    update(state, token) {
      state.name = token.value;
    }
  };
}

// A Name Token which will decorate the previous state with a `type`.
function type(style) {
  return {
    style,
    match: token => token.kind === 'Name',
    update(state, token) {
      state.prevState.type = token.value;
    }
  };
}
