/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { GraphQLSchema, KindEnum } from 'graphql';
import {
  ASTNode,
  DocumentNode,
  FragmentDefinitionNode,
  NamedTypeNode,
  TypeDefinitionNode,
} from 'graphql/language';
import { ValidationContext } from 'graphql/validation';
import {
  GraphQLArgument,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputFieldMap,
  GraphQLType,
} from 'graphql/type/definition';
import { GraphQLDirective } from 'graphql/type/directives';

export { GraphQLConfig, GraphQLProjectConfig };
import { GraphQLConfig, GraphQLProjectConfig } from 'graphql-config';

export type TokenPattern = string | ((char: string) => boolean) | RegExp;

export interface CharacterStream {
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
    consume?: boolean | null | undefined,
    caseFold?: boolean | null | undefined,
  ) => Array<string> | boolean;
  backUp: (num: number) => void;
  column: () => number;
  indentation: () => number;
  current: () => string;
}

// Cache and config-related.
export type GraphQLConfiguration = GraphQLProjectConfiguration & {
  projects?: {
    [projectName: string]: GraphQLProjectConfiguration;
  };
};

export type GraphQLProjectConfiguration = {
  // The name for this project configuration.
  // If not supplied, the object key can be used for the project name.
  name?: string;
  schemaPath?: string; // a file with schema IDL

  // For multiple applications with overlapping files,
  // these configuration options may be helpful
  includes?: Array<string>;
  excludes?: Array<string>;

  // If you'd like to specify any other configurations,
  // we provide a reserved namespace for it
  extensions?: GraphQLConfigurationExtension;
};

export type GraphQLConfigurationExtension = {
  [name: string]: unknown;
};

export interface GraphQLCache {
  getGraphQLConfig: () => GraphQLConfig;

  getObjectTypeDependencies: (
    query: string,
    fragmentDefinitions: Map<string, ObjectTypeInfo> | null | undefined,
  ) => Promise<Array<ObjectTypeInfo>>;

  getObjectTypeDependenciesForAST: (
    parsedQuery: ASTNode,
    fragmentDefinitions: Map<string, ObjectTypeInfo>,
  ) => Promise<Array<ObjectTypeInfo>>;

  getObjectTypeDefinitions: (
    graphQLConfig: GraphQLProjectConfig,
  ) => Promise<Map<string, ObjectTypeInfo>>;

  updateObjectTypeDefinition: (
    rootDir: Uri,
    filePath: Uri,
    contents: Array<CachedContent>,
  ) => Promise<undefined>;

  updateObjectTypeDefinitionCache: (
    rootDir: Uri,
    filePath: Uri,
    exists: boolean,
  ) => Promise<undefined>;

  getFragmentDependencies: (
    query: string,
    fragmentDefinitions: Map<string, FragmentInfo> | null | undefined,
  ) => Promise<Array<FragmentInfo>>;

  getFragmentDependenciesForAST: (
    parsedQuery: ASTNode,
    fragmentDefinitions: Map<string, FragmentInfo>,
  ) => Promise<Array<FragmentInfo>>;

  getFragmentDefinitions: (
    graphQLConfig: GraphQLProjectConfig,
  ) => Promise<Map<string, FragmentInfo>>;

  updateFragmentDefinition: (
    rootDir: Uri,
    filePath: Uri,
    contents: Array<CachedContent>,
  ) => Promise<undefined>;

  updateFragmentDefinitionCache: (
    rootDir: Uri,
    filePath: Uri,
    exists: boolean,
  ) => Promise<undefined>;

  getSchema: (
    appName: string | null | undefined,
    queryHasExtensions?: boolean | null | undefined,
  ) => Promise<GraphQLSchema | null | undefined>;

  handleWatchmanSubscribeEvent: (
    rootDir: string,
    projectConfig: GraphQLProjectConfig,
  ) => (result: Object) => undefined;
}

// online-parser related
export interface Position {
  line: number;
  character: number;
  lessThanOrEqualTo: (position: Position) => boolean;
}

export interface Range {
  start: Position;
  end: Position;
  containsPosition: (position: Position) => boolean;
}

export type CachedContent = {
  query: string;
  range: Range | null | undefined;
};

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

export type RuleKind =
  | KindEnum
  | 'AliasedField'
  | 'Arguments'
  | 'ShortQuery'
  | 'Query'
  | 'Mutation'
  | 'Subscription'
  | 'TypeCondition'
  | 'Invalid'
  | 'Comment'
  | 'SchemaDef'
  | 'ScalarDef'
  | 'ObjectTypeDef'
  | 'InterfaceDef'
  | 'UnionDef'
  | 'EnumDef'
  | 'FieldDef'
  | 'InputDef'
  | 'InputValueDef'
  | 'ArgumentsDef'
  | 'ExtendDef'
  | 'DirectiveDef';

export type State = {
  level: number;
  levels?: Array<number>;
  prevState: State | null | undefined;
  rule: ParseRule | null | undefined;
  kind: RuleKind | null | undefined;
  name: string | null | undefined;
  type: string | null | undefined;
  step: number;
  needsSeperator: boolean;
  needsAdvance?: boolean;
  indentLevel?: number;
};

// GraphQL Language Service related types
export type Uri = string;

export type GraphQLFileMetadata = {
  filePath: Uri;
  size: number;
  mtime: number;
};

export type GraphQLFileInfo = {
  filePath: Uri;
  content: string;
  asts: Array<DocumentNode>;
  size: number;
  mtime: number;
};

export type ContextToken = {
  start: number;
  end: number;
  string: string;
  state: State;
  style: string;
};

export type AllTypeInfo = {
  type: GraphQLType | null | undefined;
  parentType: GraphQLType | null | undefined;
  inputType: GraphQLType | null | undefined;
  directiveDef: GraphQLDirective | null | undefined;
  fieldDef: GraphQLField<any, any> | null | undefined;
  enumValue: GraphQLEnumValue | null | undefined;
  argDef: GraphQLArgument | null | undefined;
  argDefs: Array<GraphQLArgument> | null | undefined;
  objectFieldDefs: GraphQLInputFieldMap | null | undefined;
};

export type FragmentInfo = {
  filePath?: Uri;
  content: string;
  definition: FragmentDefinitionNode;
};

export type NamedTypeInfo = {
  filePath?: Uri;
  content: string;
  definition: NamedTypeNode;
};

export type ObjectTypeInfo = {
  filePath?: Uri;
  content: string;
  definition: TypeDefinitionNode;
};

export type CustomValidationRule = (
  context: ValidationContext,
) => Record<string, any>;

export type Diagnostic = {
  range: Range;
  severity?: number;
  code?: number | string;
  source?: string;
  message: string;
};

export type CompletionItem = {
  label: string;
  kind?: number;
  detail?: string;
  sortText?: string;
  documentation?: string | null | undefined;
  // GraphQL Deprecation information
  isDeprecated?: boolean | null | undefined;
  deprecationReason?: string | null | undefined;
};

// Below are basically a copy-paste from Nuclide rpc types for definitions.

// Definitions/hyperlink
export type Definition = {
  path: Uri;
  position: Position;
  range?: Range;
  id?: string;
  name?: string;
  language: string;
  projectRoot?: Uri;
};

export type DefinitionQueryResult = {
  queryRange: Array<Range>;
  definitions: Array<Definition>;
};

// Outline view
export type TokenKind =
  | 'keyword'
  | 'class-name'
  | 'constructor'
  | 'method'
  | 'param'
  | 'string'
  | 'whitespace'
  | 'plain'
  | 'type';
export type TextToken = {
  kind: TokenKind;
  value: string | undefined;
};

export type TokenizedText = Array<TextToken>;
export type OutlineTree = {
  // Must be one or the other. If both are present, tokenizedText is preferred.
  plainText?: string;
  tokenizedText?: TokenizedText;
  representativeName?: string;

  startPosition: Position;
  endPosition?: Position;
  children: Array<OutlineTree>;
};

export type Outline = {
  outlineTrees: Array<OutlineTree>;
};

export interface DidChangeWatchedFilesParams {
  changes: FileEvent[];
}

export interface FileEvent {
  uri: string;
  type: FileChangeType;
}

export const FileChangeTypeKind = {
  Created: 1,
  Changed: 2,
  Deleted: 3,
};

export type FileChangeTypeKind = {
  Created: 1;
  Changed: 2;
  Deleted: 3;
};

export type FileChangeTypeKeys = keyof FileChangeTypeKind;

export type FileChangeType = FileChangeTypeKind[FileChangeTypeKeys];
