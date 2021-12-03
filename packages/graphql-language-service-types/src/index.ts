/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
import type {
  Diagnostic as DiagnosticType,
  CompletionItem as CompletionItemType,
} from 'vscode-languageserver-types';
import type { ASTNode, GraphQLSchema } from 'graphql';

import type {
  DocumentNode,
  FragmentDefinitionNode,
  NamedTypeNode,
  TypeDefinitionNode,
  NameNode,
} from 'graphql/language';
import type {
  GraphQLArgument,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputFieldMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLType,
} from 'graphql/type/definition';
import type { GraphQLDirective } from 'graphql/type/directives';

export type Maybe<T> = T | null | undefined;

import type {
  GraphQLConfig,
  GraphQLProjectConfig,
  GraphQLExtensionDeclaration,
} from 'graphql-config';
export type {
  GraphQLConfig,
  GraphQLProjectConfig,
  GraphQLExtensionDeclaration,
};

export interface GraphQLCache {
  getGraphQLConfig: () => GraphQLConfig;

  getProjectForFile: (uri: string) => GraphQLProjectConfig;

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
export interface IPosition {
  line: number;
  character: number;
  setLine(line: number): void;
  setCharacter(character: number): void;
  lessThanOrEqualTo(position: IPosition): boolean;
}

export interface IRange {
  start: IPosition;
  end: IPosition;
  setEnd(line: number, character: number): void;
  setStart(line: number, character: number): void;
  containsPosition(position: IPosition): boolean;
}
export type CachedContent = {
  query: string;
  range: IRange | null;
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
  interfaceDef: Maybe<GraphQLInterfaceType>;
  objectTypeDef: Maybe<GraphQLObjectType>;
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
  documentation?: string | null;
  deprecationReason?: string | null;
  type?: GraphQLType;
  command?: CompletionItemType['command'];
};
// Below are basically a copy-paste from Nuclide rpc types for definitions.

// Definitions/hyperlink
export type Definition = {
  path: Uri;
  position: IPosition;
  range?: IRange;
  id?: string;
  name?: string;
  language?: string;
  projectRoot?: Uri;
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
  startPosition: IPosition;
  endPosition?: IPosition;
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

// eslint-disable-next-line no-redeclare
export type FileChangeTypeKind = {
  Created: 1;
  Changed: 2;
  Deleted: 3;
};

export type FileChangeTypeKeys = keyof FileChangeTypeKind;

export type FileChangeType = FileChangeTypeKind[FileChangeTypeKeys];

// an alias of `vscode-languageserver-types` module, to prevent import issues
export { CompletionItemKind } from 'vscode-languageserver-types';
