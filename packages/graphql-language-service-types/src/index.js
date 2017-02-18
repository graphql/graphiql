/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {GraphQLSchema} from 'graphql';
import type {ASTNode, FragmentDefinitionNode} from 'graphql/language';
import type {ValidationContext} from 'graphql/validation';
import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLType,
} from 'graphql/type/definition';

export type TokenPattern =
  string |
  ((char: string) => boolean) |
  RegExp;

export interface CharacterStream {
  getStartOfToken: () => number,
  getCurrentPosition: () => number,
  eol: () => boolean,
  sol: () => boolean,
  peek: () => string | null,
  next: () => string,
  eat: (pattern: TokenPattern) => string | void,
  eatWhile: (match: TokenPattern) => boolean,
  eatSpace: () => boolean,
  skipToEnd: () => void,
  skipTo: (position: number) => void,
  match: (
    pattern: TokenPattern,
    consume: ?boolean,
    caseFold: ?boolean
  ) => Array<string> | boolean,
  backUp: (num: number) => void,
  column: () => number,
  indentation: () => number,
  current: () => string,
}

// Cache and config-related.
export type GraphQLConfiguration = {
  schemaPath?: string,  // may be .json or .graphql
  schemaUrl?: string,
  // If env is specified, use one of the app configs in here
  env?: GraphQLConfigurationEnvs,

  // For multiple applications with overlapping files,
  // bottom configuration options may be helpful
  inputDirs?: Array<string>,
  excludeDirs?: Array<string>,

  // If you have customized validation rules to run
  customValidationRules?: string,

  // If you'd like to specify any other configurations,
  // we provide a reserved namespace for it
  extensions?: GraphQLConfigurationExtension,
};

export type GraphQLConfigurationEnvs = {
  [envVarName: string]: GraphQLConfiguration,
};

export type GraphQLConfigurationExtension = {
  [toolName: string]: any,
};

export interface GraphQLConfig {
  +getAppConfigNameByFilePath: (filePath: Uri) => ?string,
  +getRootDir: () => Uri,
  +getConfig: () => GraphQLConfiguration,
  +getName: () => string,
  +getInputDirs: (appName: ?string) => Array<Uri>,
  +getExcludeDirs: (appName: ?string) => Array<Uri>,
  +isFileInInputDirs: (fileName: Uri, appName: ?string) => boolean,
  +getSchemaPath: (appName: ?string) => ?Uri,
  +getCustomValidationRulesModulePath: (appName: ?string) => ?Uri,
}

export interface GraphQLCache {
  getGraphQLConfig: () => GraphQLConfig,

  getFragmentDependencies: (
    query: string,
    fragmentDefinitions: ?Map<string, FragmentInfo>,
  ) => Promise<Array<FragmentInfo>>,

  getFragmentDependenciesForAST: (
    parsedQuery: ASTNode,
    fragmentDefinitions: Map<string, FragmentInfo>,
  ) => Promise<Array<FragmentInfo>>,

  getFragmentDefinitions: (
    graphQLConfig: GraphQLConfig,
  ) => Promise<Map<string, FragmentInfo>>,

  getSchema: (configSchemaPath: ?Uri) => Promise<?GraphQLSchema>
}

// online-parser related
export interface Position {
  line: number,
  character: number,
  lessThanOrEqualTo: (position: Position) => boolean,
}

export interface Range {
  start: Position,
  end: Position,
  containsPosition: (position: Position) => boolean,
}

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

export type Diagnostic = {
  range: Range,
  severity?: number,
  code?: number | string,
  source?: string,
  message: string,
};

export type CompletionItem = {
  label: string,
  kind?: number,
  detail?: string,
  documentation?: string,
  // GraphQL Deprecation information
  isDeprecated?: ?string,
  deprecationReason?: ?string,
};

// Below are basically a copy-paste from Nuclide rpc types for definitions.

// Definitions/hyperlink
export type Definition = {
  path: Uri,
  position: Position,
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

  startPosition: Position,
  endPosition?: Position,
  children: Array<OutlineTree>,
};
export type Outline = {
  outlineTrees: Array<OutlineTree>,
};
