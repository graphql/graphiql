/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

// eslint-disable-next-line spaced-comment
/// <reference types='monaco-editor'/>

declare module monaco.languages.graphql {
  import type {
    SchemaLoader,
    SchemaConfig as SchemaConfiguration,
    SchemaResponse,
  } from 'graphql-language-service';

  import type { Options as PrettierConfig } from 'prettier';

  import { MonacoGraphQLApi } from '../api';
  export interface IDisposable {
    dispose(): void;
  }

  /**
   * Either introspection JSON or an SDL string
   */

  export interface IEvent<T> {
    (listener: (e: T) => any, thisArg?: any): IDisposable;
  }

  export type SchemaConfig = SchemaConfiguration;

  export type FilePointer = string | string[];

  export type FormattingOptions = PrettierConfig;

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

  export interface ICreateData {
    languageId: string;
    enableSchemaRequest: boolean;
    formattingOptions: FormattingOptions;
    languageConfig: GraphQLLanguageConfig;
  }

  export interface LanguageServiceDefaults {
    readonly onDidChange: IEvent<LanguageServiceDefaults>;
    readonly schemaConfig: SchemaConfig;
    readonly formattingOptions: FormattingOptions;
    readonly modeConfiguration: ModeConfiguration;
    setSchema(schema: RawSchema): void;
    setSchemaConfig(options: SchemaConfig): void;
    updateSchemaConfig(options: Partial<SchemaConfiguration>): void;
    setSchemaUri(schemaUri: string): void;
    setFormattingOptions(formattingOptions: FormattingOptions): void;
    setModeConfiguration(modeConfiguration: ModeConfiguration): void;
  }

  export type api = MonacoGraphQLApi;

  export type graphqlDefaults = LanguageServiceDefaults;
}
