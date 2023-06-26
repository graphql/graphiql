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

export { InsertTextFormat } from 'vscode-languageserver-types';

import type {
  ASTNode,
  GraphQLSchema,
  DocumentNode,
  FragmentDefinitionNode,
  NamedTypeNode,
  TypeDefinitionNode,
  NameNode,
  GraphQLArgument,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputFieldMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLType,
  GraphQLDirective,
} from 'graphql';

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

  getProjectForFile: (uri: string) => GraphQLProjectConfig | void;

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

export type FileChangeTypeKind = {
  Created: 1;
  Changed: 2;
  Deleted: 3;
};

export type FileChangeTypeKeys = keyof FileChangeTypeKind;

export type FileChangeType = FileChangeTypeKind[FileChangeTypeKeys];

// copied from `microsoft/vscode-languageserver-types` to prevent import issues

/**
 * The kind of a completion entry.
 */
export namespace CompletionItemKind {
  export const Text = 1 as const;
  export const Method = 2 as const;
  export const Function = 3 as const;
  export const Constructor = 4 as const;
  export const Field = 5 as const;
  export const Variable = 6 as const;
  export const Class = 7 as const;
  export const Interface = 8 as const;
  export const Module = 9 as const;
  export const Property = 10 as const;
  export const Unit = 11 as const;
  export const Value = 12 as const;
  export const Enum = 13 as const;
  export const Keyword = 14 as const;
  export const Snippet = 15 as const;
  export const Color = 16 as const;
  export const File = 17 as const;
  export const Reference = 18 as const;
  export const Folder = 19 as const;
  export const EnumMember = 20 as const;
  export const Constant = 21 as const;
  export const Struct = 22 as const;
  export const Event = 23 as const;
  export const Operator = 24 as const;
  export const TypeParameter = 25 as const;
}

export type CompletionItemKind =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25;
