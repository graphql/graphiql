import type * as monaco from '../monaco-editor';
import {
  IntrospectionQuery,
  DocumentNode,
  BuildSchemaOptions,
  parse,
  ParseOptions,
  GraphQLSchema,
  ValidationRule,
  FragmentDefinitionNode,
} from 'graphql';
import type { Options as PrettierConfig } from 'prettier';

export type BaseSchemaConfig = {
  buildSchemaOptions?: BuildSchemaOptions;
  schema?: GraphQLSchema;
  documentString?: string;
  documentAST?: DocumentNode;
  introspectionJSON?: IntrospectionQuery;
  introspectionJSONString?: string;
};

/**
 * Inspired by the `monaco-json` schema object in `DiagnosticSettings["schemas"]`,
 * which we use :)
 *
 * You have many schema format options to provide, choose one!
 *
 * For large schemas, try different formats to see what is most efficient for you.
 */
export type SchemaConfig = {
  /**
   * A unique uri string for this schema.
   * Model data will eventually be set for this URI for definition lookup
   */
  uri: string;
  /**
   * An array of URIs or globs to associate with this schema in the language worker
   * Uses `picomatch` which supports many common expressions except brackets
   * Only necessary if you provide more than one schema, otherwise it defaults to the sole schema
   */
  fileMatch?: string[];
  /**
   * provide custom options when using `buildClientSchema`, `buildASTSchema`, etc
   */
  buildSchemaOptions?: BuildSchemaOptions;
  /**
   * A GraphQLSchema instance
   */
  schema?: GraphQLSchema;
  /**
   * An SDL document string
   */
  documentString?: string;
  /**
   * A GraphQL DocumentNode AST
   */
  documentAST?: DocumentNode;
  /**
   * A parsed JSON literal of the introspection results
   */
  introspectionJSON?: IntrospectionQuery;
  /**
   * A stringified introspection JSON result
   */
  introspectionJSONString?: string;
};

/**
 * This schema loader is focused on performance for the monaco worker runtime
 * We favor taking in stringified schema representations as they can be used to communicate
 * Across the main/webworker process boundary
 *
 * @param schemaConfig {SchemaConfig}
 * @param parser {LanguageService['parse']}
 * @returns {GraphQLSchema}
 */
export type SchemaLoader = (
  schemaConfig: SchemaConfig,
  parser: GraphQLLanguageConfig['parser'],
) => GraphQLSchema;

/**
 * For the `monaco-graphql` language worker, these must be specified
 * in a custom webworker. see the readme.
 */
export type GraphQLLanguageConfig = {
  /**
   * Provide a parser that matches `graphql` `parse()` signature
   * Used for internal document parsing operations
   * for autocompletion and hover, `graphql-language-service-parser ` is used via `graphql-language-service-interface`
   */
  parser?: typeof parse;
  /**
   * Custom options passed to `parse`, whether `graphql` parse by default or custom parser
   */
  parseOptions?: ParseOptions;
  /**
   * Take a variety of schema inputs common for the language worker, and transform them
   * to at least a `schema` if not other easily available implementations
   */
  schemaLoader?: SchemaLoader;
  /**
   * An array of schema configurations from which to match files for language features
   * You can provide many formats, see the config for details!
   */
  schemas?: SchemaConfig[];
  /**
   * External fragments to be used with completion and validation
   */
  externalFragmentDefinitions: FragmentDefinitionNode[] | string | null;
  /**
   * Custom validation rules following `graphql` `ValidationRule` signature
   */
  customValidationRules?: ValidationRule[];
  /**
   * Should field leafs be automatically expanded & filled on autocomplete?
   *
   * NOTE: this can be annoying with required arguments
   */
  fillLeafsOnComplete?: boolean;
};

export interface IDisposable {
  dispose(): void;
}

export type JSONDiagnosticOptions = monaco.languages.json.DiagnosticsOptions;

export interface IEvent<T> {
  (listener: (e: T) => any, thisArg?: any): IDisposable;
}

export type FilePointer = string | string[];

export type FormattingOptions = { prettierConfig?: PrettierConfig };

export interface ModeConfiguration {
  /**
   * Defines whether the built-in documentFormattingEdit provider is enabled.
   */
  readonly documentFormattingEdits?: boolean;

  /**
   * Defines whether the built-in documentRangeFormattingEdit provider is enabled.
   */
  readonly documentRangeFormattingEdits?: boolean;

  /**
   * Defines whether the built-in completionItemProvider is enabled.
   */
  readonly completionItems?: boolean;

  /**
   * Defines whether the built-in hoverProvider is enabled.
   */
  readonly hovers?: boolean;

  /**
   * Defines whether the built-in documentSymbolProvider is enabled.
   */
  readonly documentSymbols?: boolean;

  /**
   * Defines whether the built-in tokens provider is enabled.
   */
  readonly tokens?: boolean;

  /**
   * Defines whether the built-in color provider is enabled.
   */
  readonly colors?: boolean;

  /**
   * Defines whether the built-in foldingRange provider is enabled.
   */
  readonly foldingRanges?: boolean;

  /**
   * Defines whether the built-in diagnostic provider is enabled.
   */
  readonly diagnostics?: boolean;

  /**
   * Defines whether the built-in selection range provider is enabled.
   */
  readonly selectionRanges?: boolean;
}

export type DiagnosticSettings = {
  /**
   * whilst editing operations, alongside graphql validation,
   * generate json schema for variables to validate json schema models
   * @example
   * ```ts
   * validateVariablesJSON: {
   *   "monaco://my-operation.graphql": ["monaco://my-variables.json"]
   *  }
   * ```
   */
  validateVariablesJSON?: Record<string, string[]>;
  /**
   * the default `JSONDiagnosticOptions` from `monaco-editor`'s `json` mode - to use when applying variablesJSON.
   * some examples of settings to provide here:
   *
   * - `allowComments: true` enables jsonc editing
   * - `validateSchema: 'warning'`
   * - `trailingComments` is `error` by default, and can be `warning` or `ignore`
   * {languages.json.DiagnosticsOptions}
   */
  jsonDiagnosticSettings?: monaco.languages.json.DiagnosticsOptions;
};

export type CompletionSettings = {
  /**
   * EXPERIMENTAL: Automatically fill required leaf nodes recursively
   * upon triggering code completion events.
   *
   *
   * - [x] fills required nodes
   * - [x] automatically expands relay-style node/edge fields
   * - [ ] automatically jumps to first required argument field
   *      - then, continues to prompt for required argument fields
   *      - (fixing this will make it non-experimental)
   *      - when it runs out of arguments, or you choose `{` as a completion option
   *        that appears when all required arguments are supplied, the argument
   *        selection closes `)` and the leaf field expands again `{ \n| }`
   */
  __experimental__fillLeafsOnComplete?: boolean;
};

/**
 * Configuration to initialize the editor with
 */
export type MonacoGraphQLInitializeConfig = {
  /**
   * custom (experimental) settings for autocompletion behaviour
   */
  completionSettings?: CompletionSettings;
  /**
   * custom settings for diagnostics (validation)
   */
  diagnosticSettings?: DiagnosticSettings;
  /**
   * provide prettier formatting options as `prettierConfig.<option>`
   * @example
   * ```ts
   *  initializeMode({
   *   formattingOptions: { prettierConfig: { useTabs: true } }
   *  })
   * ```
   */
  formattingOptions?: FormattingOptions;
  /**
   * Generic monaco language mode options, same as for the official monaco json mode
   */
  modeConfiguration?: ModeConfiguration;
  /**
   * Specify array of `SchemaConfig` items used to initialize the `GraphQLWorker` if available.
   * You can also `api.setSchemaConfig()` after instantiating the mode.
   */
  schemas?: SchemaConfig[];
};

export interface ICreateData {
  languageId: string;
  formattingOptions?: FormattingOptions;
  languageConfig: GraphQLLanguageConfig;
  diagnosticSettings?: DiagnosticSettings;
}
