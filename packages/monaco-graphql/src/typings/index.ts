import type {
  SchemaConfig as SchemaConfiguration,
  GraphQLLanguageConfig,
} from 'graphql-language-service';
import type { languages } from 'monaco-editor';

import type { Options as PrettierConfig } from 'prettier';

export interface IDisposable {
  dispose(): void;
}

export type SchemaConfig = SchemaConfiguration;

export type JSONDiagnosticOptions = languages.json.DiagnosticsOptions;
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
   *   "monaco://myoperation.graphql": ["monaco://myvariables.json"]
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
  jsonDiagnosticSettings?: languages.json.DiagnosticsOptions;
};

/**
 * Configuration to initialize the editor with
 */
export type MonacoGraphQLInitializeConfig = {
  /**
   * Specify array of `SchemaConfig` items used to initialize the `GraphQLWorker` if available.
   * You can also `api.setSchemaConfig()` after instantiating the mode.
   */
  schemas?: SchemaConfig[];
  /**
   *
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
  modeConfiguration?: ModeConfiguration;
};

export interface ICreateData {
  languageId: string;
  formattingOptions?: FormattingOptions;
  languageConfig: GraphQLLanguageConfig;
  diagnosticSettings: DiagnosticSettings;
}
