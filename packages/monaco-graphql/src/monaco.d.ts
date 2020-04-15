/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

declare module monaco.languages.graphql {
  export interface IDisposable {
    dispose(): void;
  }

  export interface IEvent<T> {
    (listener: (e: T) => any, thisArg?: any): IDisposable;
  }
  export interface DiagnosticsOptions {
    /**
     * If set, the validator will be enabled and perform syntax validation as well as schema based validation.
     */
    readonly validate?: boolean;
    /**
     * If set, comments are tolerated. If set to false, syntax errors will be emitted for comments.
     */
    readonly allowComments?: boolean;
    /**
     * A list of known schemas and/or associations of schemas to file names.
     */
    readonly schemas?: {
      /**
       * The URI of the schema, which is also the identifier of the schema.
       */
      readonly uri: string;
      /**
       * A list of file names that are associated to the schema. The '*' wildcard can be used. For example '*.schema.json', 'package.json'
       */
      readonly fileMatch?: string[];
      /**
       * The schema for the given URI.
       */
      readonly schema?: any;
    }[];
    /**
     *  If set, the schema service would load schema content on-demand with 'fetch' if available
     */
    readonly enableSchemaRequest?: boolean;
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

  export interface LanguageServiceDefaults {
    readonly onDidChange: IEvent<LanguageServiceDefaults>;
    readonly diagnosticsOptions: DiagnosticsOptions;
    readonly modeConfiguration: ModeConfiguration;
    setDiagnosticsOptions(options: DiagnosticsOptions): void;
    setModeConfiguration(modeConfiguration: ModeConfiguration): void;
  }

  export const graphqlDefaults: LanguageServiceDefaults;
}
