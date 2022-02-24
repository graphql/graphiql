/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { State, Token, Rule, RuleKind, ParseRule } from './types';
import CharacterStream from './CharacterStream';
import { opt, list, butNot, t, p } from './RuleHelpers';
import { Kind } from 'graphql';

/**
 * Whitespace tokens defined in GraphQL spec.
 */
export const isIgnored = (ch: string) =>
  ch === ' ' ||
  ch === '\t' ||
  ch === ',' ||
  ch === '\n' ||
  ch === '\r' ||
  ch === '\uFEFF' ||
  ch === '\u00A0';

/**
 * The lexer rules. These are exactly as described by the spec.
 */
export const LexRules = {
  // The Name token.
  Name: /^[_A-Za-z][_0-9A-Za-z]*/,

  // All Punctuation used in GraphQL
  Punctuation: /^(?:!|\$|\(|\)|\.\.\.|:|=|&|@|\[|]|\{|\||\})/,

  // Combines the IntValue and FloatValue tokens.
  Number: /^-?(?:0|(?:[1-9][0-9]*))(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?/,

  // Note the closing quote is made optional as an IDE experience improvment.
  String: /^(?:"""(?:\\"""|[^"]|"[^"]|""[^"])*(?:""")?|"(?:[^"\\]|\\(?:"|\/|\\|b|f|n|r|t|u[0-9a-fA-F]{4}))*"?)/,

  // Comments consume entire lines.
  Comment: /^#.*/,
};

/**
 * The parser rules. These are very close to, but not exactly the same as the
 * spec. Minor deviations allow for a simpler implementation. The resulting
 * parser can parse everything the spec declares possible.
 */
export const ParseRules: { [name: string]: ParseRule } = {
  Document: [list('Definition')],
  Definition(token: Token): RuleKind | void {
    switch (token.value) {
      case '{':
        return 'ShortQuery';
      case 'query':
        return 'Query';
      case 'mutation':
        return 'Mutation';
      case 'subscription':
        return 'Subscription';
      case 'fragment':
        return Kind.FRAGMENT_DEFINITION;
      case 'schema':
        return 'SchemaDef';
      case 'scalar':
        return 'ScalarDef';
      case 'type':
        return 'ObjectTypeDef';
      case 'interface':
        return 'InterfaceDef';
      case 'union':
        return 'UnionDef';
      case 'enum':
        return 'EnumDef';
      case 'input':
        return 'InputDef';
      case 'extend':
        return 'ExtendDef';
      case 'directive':
        return 'DirectiveDef';
    }
  },
  // Note: instead of "Operation", these rules have been separated out.
  ShortQuery: ['SelectionSet'],
  Query: [
    word('query'),
    opt(name('def')),
    opt('VariableDefinitions'),
    list('Directive'),
    'SelectionSet',
  ],

  Mutation: [
    word('mutation'),
    opt(name('def')),
    opt('VariableDefinitions'),
    list('Directive'),
    'SelectionSet',
  ],

  Subscription: [
    word('subscription'),
    opt(name('def')),
    opt('VariableDefinitions'),
    list('Directive'),
    'SelectionSet',
  ],

  VariableDefinitions: [p('('), list('VariableDefinition'), p(')')],
  VariableDefinition: ['Variable', p(':'), 'Type', opt('DefaultValue')],
  Variable: [p('$', 'variable'), name('variable')],
  DefaultValue: [p('='), 'Value'],
  SelectionSet: [p('{'), list('Selection'), p('}')],
  Selection(token: Token, stream: CharacterStream) {
    return token.value === '...'
      ? stream.match(/[\s\u00a0,]*(on\b|@|{)/, false)
        ? 'InlineFragment'
        : 'FragmentSpread'
      : stream.match(/[\s\u00a0,]*:/, false)
      ? 'AliasedField'
      : 'Field';
  },
  // Note: this minor deviation of "AliasedField" simplifies the lookahead.
  AliasedField: [
    name('property'),
    p(':'),
    name('qualifier'),
    opt('Arguments'),
    list('Directive'),
    opt('SelectionSet'),
  ],

  Field: [
    name('property'),
    opt('Arguments'),
    list('Directive'),
    opt('SelectionSet'),
  ],

  Arguments: [p('('), list('Argument'), p(')')],
  Argument: [name('attribute'), p(':'), 'Value'],
  FragmentSpread: [p('...'), name('def'), list('Directive')],
  InlineFragment: [
    p('...'),
    opt('TypeCondition'),
    list('Directive'),
    'SelectionSet',
  ],

  FragmentDefinition: [
    word('fragment'),
    opt(butNot(name('def'), [word('on')])),
    'TypeCondition',
    list('Directive'),
    'SelectionSet',
  ],

  TypeCondition: [word('on'), 'NamedType'],
  // Variables could be parsed in cases where only Const is expected by spec.
  Value(token: Token) {
    switch (token.kind) {
      case 'Number':
        return 'NumberValue';
      case 'String':
        return 'StringValue';
      case 'Punctuation':
        switch (token.value) {
          case '[':
            return 'ListValue';
          case '{':
            return 'ObjectValue';
          case '$':
            return 'Variable';
          case '&':
            return 'NamedType';
        }

        return null;
      case 'Name':
        switch (token.value) {
          case 'true':
          case 'false':
            return 'BooleanValue';
        }

        if (token.value === 'null') {
          return 'NullValue';
        }
        return 'EnumValue';
    }
  },
  NumberValue: [t('Number', 'number')],
  StringValue: [
    {
      style: 'string',
      match: token => token.kind === 'String',
      update(state: State, token: Token) {
        if (token.value.startsWith('"""')) {
          state.inBlockstring = !token.value.slice(3).endsWith('"""');
        }
      },
    },
  ],
  BooleanValue: [t('Name', 'builtin')],
  NullValue: [t('Name', 'keyword')],
  EnumValue: [name('string-2')],
  ListValue: [p('['), list('Value'), p(']')],
  ObjectValue: [p('{'), list('ObjectField'), p('}')],
  ObjectField: [name('attribute'), p(':'), 'Value'],
  Type(token: Token) {
    return token.value === '[' ? 'ListType' : 'NonNullType';
  },
  // NonNullType has been merged into ListType to simplify.
  ListType: [p('['), 'Type', p(']'), opt(p('!'))],
  NonNullType: ['NamedType', opt(p('!'))],
  NamedType: [type('atom')],
  Directive: [p('@', 'meta'), name('meta'), opt('Arguments')],
  DirectiveDef: [
    word('directive'),
    p('@', 'meta'),
    name('meta'),
    opt('ArgumentsDef'),
    word('on'),
    list('DirectiveLocation', p('|')),
  ],
  InterfaceDef: [
    word('interface'),
    name('atom'),
    opt('Implements'),
    list('Directive'),
    p('{'),
    list('FieldDef'),
    p('}'),
  ],
  Implements: [word('implements'), list('NamedType', p('&'))],
  DirectiveLocation: [name('string-2')],
  // GraphQL schema language
  SchemaDef: [
    word('schema'),
    list('Directive'),
    p('{'),
    list('OperationTypeDef'),
    p('}'),
  ],

  OperationTypeDef: [name('keyword'), p(':'), name('atom')],
  ScalarDef: [word('scalar'), name('atom'), list('Directive')],
  ObjectTypeDef: [
    word('type'),
    name('atom'),
    opt('Implements'),
    list('Directive'),
    p('{'),
    list('FieldDef'),
    p('}'),
  ],

  FieldDef: [
    name('property'),
    opt('ArgumentsDef'),
    p(':'),
    'Type',
    list('Directive'),
  ],

  ArgumentsDef: [p('('), list('InputValueDef'), p(')')],
  InputValueDef: [
    name('attribute'),
    p(':'),
    'Type',
    opt('DefaultValue'),
    list('Directive'),
  ],

  UnionDef: [
    word('union'),
    name('atom'),
    list('Directive'),
    p('='),
    list('UnionMember', p('|')),
  ],

  UnionMember: ['NamedType'],
  EnumDef: [
    word('enum'),
    name('atom'),
    list('Directive'),
    p('{'),
    list('EnumValueDef'),
    p('}'),
  ],

  EnumValueDef: [name('string-2'), list('Directive')],
  InputDef: [
    word('input'),
    name('atom'),
    list('Directive'),
    p('{'),
    list('InputValueDef'),
    p('}'),
  ],
  ExtendDef: [word('extend'), 'ObjectTypeDef'],
};

// A keyword Token.
function word(value: string) {
  return {
    style: 'keyword',
    match: (token: Token) => token.kind === 'Name' && token.value === value,
  };
}

// A Name Token which will decorate the state with a `name`.
function name(style: string): Rule {
  return {
    style,
    match: (token: Token) => token.kind === 'Name',
    update(state: State, token: Token) {
      state.name = token.value;
    },
  };
}

// A Name Token which will decorate the previous state with a `type`.
function type(style: string) {
  return {
    style,
    match: (token: Token) => token.kind === 'Name',
    update(state: State, token: Token) {
      if (state.prevState && state.prevState.prevState) {
        state.name = token.value;
        state.prevState.prevState.type = token.value;
      }
    },
  };
}
