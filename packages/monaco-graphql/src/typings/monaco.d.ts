/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

// eslint-disable-next-line spaced-comment
/// <reference path='../../../../node_modules/monaco-editor/monaco.d.ts'/>

declare module monaco.languages.graphql {
  import type { SchemaLoader, SchemaConfig } from 'graphql-languageservice';

  import type { GraphQLSchema } from 'graphql';
  import type { Options as PrettierConfig } from 'prettier';

  import { MonacoGraphQLApi } from '../api';

  export interface IDisposable {
    dispose(): void;
  }

  export type SchemaConfig = SchemaConfig;

  export interface IEvent<T> {
    (listener: (e: T) => any, thisArg?: any): IDisposable;
  }

  export type FilePointer = string | string[];

  export interface FormattingOptions {
    prettierConfig: PrettierConfig;
  }

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
    schemaConfig: SchemaConfig;
    schemaLoader: () => Promise<GraphQLSchema>;
    formattingOptions?: FormattingOptions;
  }

  export interface LanguageServiceDefaults {
    readonly onDidChange: IEvent<
      monaco.languages.graphql.LanguageServiceDefaults
    >;
    readonly schemaConfig: SchemaConfig;
    readonly formattingOptions: FormattingOptions;
    readonly modeConfiguration: ModeConfiguration;
    setSchemaConfig(options: SchemaConfig): void;
    updateSchemaConfig(options: Partial<SchemaOptoons>): void;
    setSchemaUri(schemaUri: string): void;
    setFormattingOptions(formattingOptions: FormattingOptions): void;
    setModeConfiguration(modeConfiguration: ModeConfiguration): void;
  }

  export type api = MonacoGraphQLApi;

  export const graphqlDefaults: LanguageServiceDefaults;
}
