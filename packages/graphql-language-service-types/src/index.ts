/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
import {
  Diagnostic as DiagnosticType,
  Position as PositionType,
  CompletionItem as CompletionItemType,
} from 'vscode-languageserver-protocol';
import { GraphQLSchema, KindEnum } from 'graphql';

import {
  ASTNode,
  DocumentNode,
  FragmentDefinitionNode,
  NamedTypeNode,
  TypeDefinitionNode,
  NameNode,
} from 'graphql/language';
import {
  GraphQLArgument,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputFieldMap,
  GraphQLType,
} from 'graphql/type/definition';
import { GraphQLDirective } from 'graphql/type/directives';

export type Maybe<T> = T | null | undefined;

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
    consume?: Maybe<boolean>,
    caseFold?: Maybe<boolean>,
  ) => string[] | boolean;
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
  includes?: string[];
  excludes?: string[];

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
    fragmentDefinitions: Map<string, ObjectTypeInfo>,
  ) => Promise<ObjectTypeInfo[]>;

  getObjectTypeDependenciesForAST: (
    parsedQuery: ASTNode,
    fragmentDefinitions: Map<string, ObjectTypeInfo>,
  ) => Promise<ObjectTypeInfo[]>;

  getObjectTypeDefinitions: (
    graphQLConfig: GraphQLProjectConfig,
  ) => Promise<Map<string, ObjectTypeInfo>>;

  updateObjectTypeDefinition: (
    rootDir: Uri,
    filePath: Uri,
    contents: CachedContent[],
  ) => Promise<void>;

  updateObjectTypeDefinitionCache: (
    rootDir: Uri,
    filePath: Uri,
    exists: boolean,
  ) => Promise<void>;

  getFragmentDependencies: (
    query: string,
    fragmentDefinitions: Maybe<Map<string, FragmentInfo>>,
  ) => Promise<FragmentInfo[]>;

  getFragmentDependenciesForAST: (
    parsedQuery: ASTNode,
    fragmentDefinitions: Map<string, FragmentInfo>,
  ) => Promise<FragmentInfo[]>;

  getFragmentDefinitions: (
    graphQLConfig: GraphQLProjectConfig,
  ) => Promise<Map<string, FragmentInfo>>;

  updateFragmentDefinition: (
    rootDir: Uri,
    filePath: Uri,
    contents: CachedContent[],
  ) => Promise<void>;

  updateFragmentDefinitionCache: (
    rootDir: Uri,
    filePath: Uri,
    exists: boolean,
  ) => Promise<void>;

  getSchema: (
    appName?: string,
    queryHasExtensions?: boolean,
  ) => Promise<GraphQLSchema | null>;
}

// online-parser related
export type Position = PositionType & {
  line: number;
  character: number;
  lessThanOrEqualTo?: (position: Position) => boolean;
};

export interface Range {
  start: Position;
  end: Position;
  containsPosition: (position: Position) => boolean;
}

export type CachedContent = {
  query: string;
  range: Range | null;
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
  levels?: number[];
  prevState: Maybe<State>;
  rule: Maybe<ParseRule>;
  kind: Maybe<RuleKind>;
  name: Maybe<string>;
  type: Maybe<string>;
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
  asts: DocumentNode[];
  queries: CachedContent[];
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
  type: Maybe<GraphQLType>;
  parentType: Maybe<GraphQLType>;
  inputType: Maybe<GraphQLType>;
  directiveDef: Maybe<GraphQLDirective>;
  fieldDef: Maybe<GraphQLField<any, any>>;
  enumValue: Maybe<GraphQLEnumValue>;
  argDef: Maybe<GraphQLArgument>;
  argDefs: Maybe<GraphQLArgument[]>;
  objectFieldDefs: Maybe<GraphQLInputFieldMap>;
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

export type Diagnostic = DiagnosticType;

export type CompletionItem = CompletionItemType & {
  isDeprecated?: boolean;
  deprecationReason?: Maybe<string>;
};

// Below are basically a copy-paste from Nuclide rpc types for definitions.

// Definitions/hyperlink
export type Definition = {
  path: Uri;
  position: Position;
  range?: Range;
  id?: string;
  name?: string;
  language?: string;
  projectRoot?: Uri;
};

export type DefinitionQueryResult = {
  queryRange: Range[];
  definitions: Definition[];
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
  value: string | NameNode;
};

export type TokenizedText = TextToken[];
export type OutlineTree = {
  // Must be one or the other. If both are present, tokenizedText is preferred.
  plainText?: string;
  tokenizedText?: TokenizedText;
  representativeName?: string;
  kind: string;
  startPosition: Position;
  endPosition?: Position;
  children: OutlineTree[];
};

export type Outline = {
  outlineTrees: OutlineTree[];
};

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
