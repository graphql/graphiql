/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

/**
 * A simple LanguageService used by `monaco-graphql`'s webworker lives here.
 *
 * TODO: retire `graphql-language-service-{parser,interface,types,utils}` and merge with this workspace
 */
/**
 * A whole bunch of the key language services
 */
export {
  getAutocompleteSuggestions,
  getDefinitionQueryResultForDefinitionNode,
  getDefinitionQueryResultForFragmentSpread,
  getDefinitionQueryResultForNamedType,
  getDefinitionQueryResultForField,
  getDefinitionState,
  getDiagnostics,
  getFieldDef,
  getFragmentDefinitions,
  getHoverInformation,
  getOutline,
  getRange,
  getTokenAtPosition,
  getTypeInfo,
  getVariableCompletions,
  SEVERITY,
  Severity,
  HoverConfig,
  SeverityEnum,
  DIAGNOSTIC_SEVERITY,
  DefinitionQueryResult,
  canUseDirective,
  SuggestionCommand,
  AutocompleteSuggestionOptions,
  validateQuery,
} from './interface';

/**
 * The dependency-less streaming token parser used for getAutocompleteSuggestions, getHover and more
 */
export {
  onlineParser,
  ParseRules,
  CharacterStream,
  RuleKinds,
  LexRules,
  isIgnored,
  p,
  list,
  t,
  opt,
} from './parser';

export type {
  RuleOrString,
  ParserOptions,
  ParseRule,
  TokenPattern,
  State,
  CharacterStreamInterface,
  RuleKindEnum,
  Token,
  ContextToken,
  ContextTokenForCodeMirror,
  ContextTokenUnion,
  RuleKind,
} from './parser';

/**
 * Types and enums to use across projects
 */
export type {
  CompletionItem,
  GraphQLProjectConfig,
  Maybe,
  IPosition,
  Diagnostic,
  IRange,
  Definition,
  CachedContent,
  GraphQLConfig,
  GraphQLFileMetadata,
  Uri,
  ObjectTypeInfo,
  Outline,
  OutlineTree,
  FragmentInfo,
  GraphQLFileInfo,
  FileChangeType,
  GraphQLCache,
  GraphQLExtensionDeclaration,
} from './types';

export { CompletionItemKind, FileChangeTypeKind } from './types';

/**
 * Utilities useful for language services across runtimes
 */
export {
  JSONSchema6,
  JSONSchema6TypeName,
  JSONSchemaOptions,
  getASTNodeAtPosition,
  getFragmentDependencies,
  getFragmentDependenciesForAST,
  getOperationASTFacts,
  getOperationFacts,
  getQueryFacts,
  getVariablesJSONSchema,
  offsetToPosition,
  OperationFacts,
  pointToOffset,
  Position,
  collectVariables,
  validateWithCustomRules,
  VariableToType,
  QueryFacts,
  Range,
} from './utils';
