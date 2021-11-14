import type {
  SchemaConfig as SchemaConfiguration,
  GraphQLLanguageConfig,
} from 'graphql-language-service';

import type { Options as PrettierConfig } from 'prettier';

export interface IDisposable {
  dispose(): void;
}

export type SchemaConfig = SchemaConfiguration;

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

export type MonacoGraphQLSchemaConfig = {
  /**
   * should the schema load when calling `initialize()` ?
   * @default true
   */
  loadSchemaOnInit?: boolean;
  /**
   * should the schema reload when calling a change or update function ?
   * @default true
   */
  loadSchemaOnChange?: boolean;
} & SchemaConfig;

export type MonacoGraphQLInitializeConfig = {
  schemaConfig: MonacoGraphQLSchemaConfig;
  formattingOptions?: FormattingOptions;
  modeConfiguration?: ModeConfiguration;
};

export interface ICreateData {
  languageId: string;
  enableSchemaRequest: boolean;
  formattingOptions?: FormattingOptions;
  languageConfig: GraphQLLanguageConfig;
}
