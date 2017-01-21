/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {ASTNode, FragmentDefinitionNode} from 'graphql/language';
import type {ValidationContext} from 'graphql/validation';
import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLType,
} from 'graphql/type/definition';
import type CharacterStream from '../parser/CharacterStream';
import type {Point, Range} from '../utils/Range';

// online-parser related
export type ParseRule =
  ((token: Token, stream: CharacterStream) => ?string) |
  Array<Rule | string>;

export type Token = {
  kind: string,
  value: string,
};

export type Rule = {
  style?: string,
  match?: (token: Token) => boolean,
  update?: (state: State, token: Token) => void,
  separator?: string | Rule,
  isList?: boolean,
  ofRule?: Rule | string,
};

export type State = {
  level: number,
  levels?: Array<number>,
  prevState: ?State,
  rule: ?ParseRule,
  kind: ?string,
  name: ?string,
  type: ?string,
  step: number,
  needsSeperator: boolean,
  needsAdvance?: boolean,
  indentLevel?: number,
};

// GraphQL Language Service related types
export type Uri = string;

export type GraphQLFileMetadata = {
  filePath: Uri,
  size: number,
  mtime: number,
};

export type GraphQLFileInfo = {
  filePath: Uri,
  content: string,
  ast: ?ASTNode,
  size: number,
  mtime: number,
};

export type ContextToken = {
  start: number,
  end: number,
  string: string,
  state: State,
  style: string,
};

export type TypeInfo = {
  type: GraphQLType,
  parentType: GraphQLType,
  inputType: GraphQLType,
  directiveDef: GraphQLType,
  fieldDef: ?GraphQLField<*, *>,
  argDef: GraphQLArgument,
  argDefs: ?Array<GraphQLArgument>,
  objectFieldDefs: GraphQLInputField,
};

export type FragmentInfo = {
  filePath?: Uri,
  content: string,
  definition: FragmentDefinitionNode,
};

export type CustomValidationRule = (context: ValidationContext) => Object;

export type DiagnosticType = {
  name: string,
  type: string,
  text: string,
  range: Range,
  filePath: Uri,
};

export type AutocompleteSuggestionType = {
  text: string,
  type?: GraphQLType,
  description?: ?string,
  isDeprecated?: ?string,
  deprecationReason?: ?string,
};

// Below are basically a copy-paste from Nuclide rpc types for definitions.
//
// Definitions/hyperlink
export type Definition = {
  path: Uri,
  position: Point,
  range?: Range,
  id?: string,
  name?: string,
  language: string,
  projectRoot?: Uri,
};
export type DefinitionQueryResult = {
  queryRange: Array<Range>,
  definitions: Array<Definition>,
};

// Outline view
export type TokenKind = 'keyword'
  | 'class-name'
  | 'constructor'
  | 'method'
  | 'param'
  | 'string'
  | 'whitespace'
  | 'plain'
  | 'type'
  ;
export type TextToken = {
  kind: TokenKind,
  value: string,
};
export type TokenizedText = Array<TextToken>;
export type OutlineTree = {
  // Must be one or the other. If both are present, tokenizedText is preferred.
  plainText?: string,
  tokenizedText?: TokenizedText,
  representativeName?: string,

  startPosition: Point,
  endPosition?: Point,
  children: Array<OutlineTree>,
};
export type Outline = {
  outlineTrees: Array<OutlineTree>,
};
