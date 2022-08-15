import { Kind } from 'graphql';
import { Maybe } from '../types';
import CharacterStream from './CharacterStream';

export type ContextToken = {
  start: number;
  end: number;
  string: string;
  state: State;
  style?: string;
};

export type ContextTokenForCodeMirror = {
  start: number;
  end: number;
  string: string;
  type: string | null;
  state: State;
};

export type ContextTokenUnion = ContextToken | ContextTokenForCodeMirror;

export type RuleOrString = Rule | string;

export type ParseRule =
  | RuleOrString[]
  | ((token: Token, stream: CharacterStream) => string | null | void);

export type Token = {
  kind: string;
  value: string;
};

export type Rule = {
  style?: string;
  match?: (token: Token) => boolean;
  update?: (state: State, token: Token) => void;
  separator?: string | Rule;
  isList?: boolean;
  ofRule?: Rule | string;
};

export type State = {
  level: number;
  levels?: number[];
  prevState: Maybe<State>;
  rule: Maybe<ParseRule>;
  kind: Maybe<RuleKind>;
  name: Maybe<string>;
  type: Maybe<string>;
  step: number;
  needsSeparator: boolean;
  needsAdvance?: boolean;
  indentLevel?: number;
  inBlockstring?: boolean;
};

export const AdditionalRuleKinds: _AdditionalRuleKinds = {
  ALIASED_FIELD: 'AliasedField',
  ARGUMENTS: 'Arguments',
  SHORT_QUERY: 'ShortQuery',
  QUERY: 'Query',
  MUTATION: 'Mutation',
  SUBSCRIPTION: 'Subscription',
  TYPE_CONDITION: 'TypeCondition',
  INVALID: 'Invalid',
  COMMENT: 'Comment',
  SCHEMA_DEF: 'SchemaDef',
  SCALAR_DEF: 'ScalarDef',
  OBJECT_TYPE_DEF: 'ObjectTypeDef',
  OBJECT_VALUE: 'ObjectValue',
  LIST_VALUE: 'ListValue',
  INTERFACE_DEF: 'InterfaceDef',
  UNION_DEF: 'UnionDef',
  ENUM_DEF: 'EnumDef',
  ENUM_VALUE: 'EnumValue',
  FIELD_DEF: 'FieldDef',
  INPUT_DEF: 'InputDef',
  INPUT_VALUE_DEF: 'InputValueDef',
  ARGUMENTS_DEF: 'ArgumentsDef',
  EXTEND_DEF: 'ExtendDef',
  EXTENSION_DEFINITION: 'ExtensionDefinition',
  DIRECTIVE_DEF: 'DirectiveDef',
  IMPLEMENTS: 'Implements',
  VARIABLE_DEFINITIONS: 'VariableDefinitions',
  TYPE: 'Type',
};

export type _AdditionalRuleKinds = {
  ALIASED_FIELD: 'AliasedField';
  ARGUMENTS: 'Arguments';
  SHORT_QUERY: 'ShortQuery';
  QUERY: 'Query';
  MUTATION: 'Mutation';
  SUBSCRIPTION: 'Subscription';
  TYPE_CONDITION: 'TypeCondition';
  INVALID: 'Invalid';
  COMMENT: 'Comment';
  SCHEMA_DEF: 'SchemaDef';
  SCALAR_DEF: 'ScalarDef';
  OBJECT_TYPE_DEF: 'ObjectTypeDef';
  OBJECT_VALUE: 'ObjectValue';
  LIST_VALUE: 'ListValue';
  INTERFACE_DEF: 'InterfaceDef';
  UNION_DEF: 'UnionDef';
  ENUM_DEF: 'EnumDef';
  ENUM_VALUE: 'EnumValue';
  FIELD_DEF: 'FieldDef';
  INPUT_DEF: 'InputDef';
  INPUT_VALUE_DEF: 'InputValueDef';
  ARGUMENTS_DEF: 'ArgumentsDef';
  EXTEND_DEF: 'ExtendDef';
  EXTENSION_DEFINITION: 'ExtensionDefinition';
  DIRECTIVE_DEF: 'DirectiveDef';
  IMPLEMENTS: 'Implements';
  VARIABLE_DEFINITIONS: 'VariableDefinitions';
  TYPE: 'Type';
};

export const RuleKinds = {
  ...Kind,
  ...AdditionalRuleKinds,
};

export type _RuleKinds = typeof Kind & typeof AdditionalRuleKinds;

export type RuleKind = _RuleKinds[keyof _RuleKinds];
export type RuleKindEnum = RuleKind;
export type TokenPattern = string | ((char: string) => boolean) | RegExp;

export interface CharacterStreamInterface {
  getStartOfToken: () => number;
  getCurrentPosition: () => number;
  eol: () => boolean;
  sol: () => boolean;
  peek: () => string | null;
  next: () => string;
  eat: (pattern: TokenPattern) => string | undefined;
  eatWhile: (match: TokenPattern) => boolean;
  eatSpace: () => boolean;
  skipToEnd: () => void;
  skipTo: (position: number) => void;
  match: (
    pattern: TokenPattern,
    consume?: Maybe<boolean>,
    caseFold?: Maybe<boolean>,
  ) => string[] | boolean;
  backUp: (num: number) => void;
  column: () => number;
  indentation: () => number;
  current: () => string;
}
