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
  CompletionItem as CompletionItemType,
} from 'vscode-languageserver-types';
import { Kind, ASTNode, GraphQLSchema } from 'graphql';

import {
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

import {
  GraphQLConfig,
  GraphQLProjectConfig,
  GraphQLExtensionDeclaration,
} from 'graphql-config';
export { GraphQLConfig, GraphQLProjectConfig, GraphQLExtensionDeclaration };

import { _Kind } from 'graphql/language/kinds';

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
export type Position = {
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
  | ((token: Token, stream: CharacterStreamInterface) => string | null | void);

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
  INTERFACE_DEF: 'InterfaceDef',
  UNION_DEF: 'UnionDef',
  ENUM_DEF: 'EnumDef',
  FIELD_DEF: 'FieldDef',
  INPUT_DEF: 'InputDef',
  INPUT_VALUE_DEF: 'InputValueDef',
  ARGUMENTS_DEF: 'ArgumentsDef',
  EXTEND_DEF: 'ExtendDef',
  DIRECTIVE_DEF: 'DirectiveDef',
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
  INTERFACE_DEF: 'InterfaceDef';
  UNION_DEF: 'UnionDef';
  ENUM_DEF: 'EnumDef';
  FIELD_DEF: 'FieldDef';
  INPUT_DEF: 'InputDef';
  INPUT_VALUE_DEF: 'InputValueDef';
  ARGUMENTS_DEF: 'ArgumentsDef';
  EXTEND_DEF: 'ExtendDef';
  DIRECTIVE_DEF: 'DirectiveDef';
};

export const RuleKinds = {
  ...Kind,
  ...AdditionalRuleKinds,
};

export type _RuleKinds = _Kind & typeof AdditionalRuleKinds;

export type RuleKind = _RuleKinds[keyof _RuleKinds];
export type RuleKindEnum = RuleKind;

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

export type ContextTokenForCodeMirror = {
  start: number;
  end: number;
  string: string;
  type: string | null;
  state: State;
};

export type ContextTokenUnion = ContextToken | ContextTokenForCodeMirror;

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

export type CompletionItemBase = {
  label: string;
  isDeprecated?: boolean;
};

export type CompletionItem = CompletionItemType & {
  isDeprecated?: boolean;
  deprecationReason?: Maybe<string>;
};

export type CompletionItemForCodeMirror = {
  label: string;
  type?: GraphQLType;
  documentation: string | null | undefined;
  isDeprecated?: boolean;
  deprecationReason: string | null | undefined;
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
