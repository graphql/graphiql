/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Emitter, IEvent } from 'monaco-editor';
import type { RawSchema, SchemaResponse } from 'graphql-language-service';

export class LanguageServiceDefaultsImpl
  implements monaco.languages.graphql.LanguageServiceDefaults {
  private _onDidChange = new Emitter<
    monaco.languages.graphql.LanguageServiceDefaults
  >();
  private _schemaConfig!: monaco.languages.graphql.SchemaConfig;
  private _formattingOptions!: monaco.languages.graphql.FormattingOptions;
  private _modeConfiguration!: monaco.languages.graphql.ModeConfiguration;
  private _languageId: string;
  private _schema!: SchemaResponse;
  private _rawSchema!: RawSchema;

  constructor({
    languageId,
    schemaConfig,
    modeConfiguration,
    formattingOptions,
  }: {
    languageId: string;
    schemaConfig: monaco.languages.graphql.SchemaConfig;
    modeConfiguration: monaco.languages.graphql.ModeConfiguration;
    formattingOptions: monaco.languages.graphql.FormattingOptions;
  }) {
    this._languageId = languageId;
    this.setSchemaConfig(schemaConfig);
    this.setModeConfiguration(modeConfiguration);
    this.setFormattingOptions(formattingOptions);
  }
  get onDidChange(): IEvent<monaco.languages.graphql.LanguageServiceDefaults> {
    return this._onDidChange.event;
  }

  get languageId(): string {
    return this._languageId;
  }
  get modeConfiguration(): monaco.languages.graphql.ModeConfiguration {
    return this._modeConfiguration;
  }
  get schemaConfig(): monaco.languages.graphql.SchemaConfig {
    return this._schemaConfig;
  }
  get formattingOptions(): monaco.languages.graphql.FormattingOptions {
    return this._formattingOptions;
  }
  get schema(): SchemaResponse {
    return this._schema;
  }
  get rawSchema(): RawSchema {
    return this._rawSchema;
  }

  setSchemaConfig(options: monaco.languages.graphql.SchemaConfig): void {
    this._schemaConfig = options || Object.create(null);
    this._onDidChange.fire(this);
  }

  updateSchemaConfig(
    options: Partial<monaco.languages.graphql.SchemaConfig>,
  ): void {
    this._schemaConfig = { ...this._schemaConfig, ...options };
    this._onDidChange.fire(this);
  }

  setSchemaUri(schemaUri: string): void {
    this.setSchemaConfig({ ...this._schemaConfig, schema: schemaUri });
  }

  setSchema(schema: RawSchema) {
    this._rawSchema = schema;
    this._onDidChange.fire(this);
  }

  setModeConfiguration(
    modeConfiguration: monaco.languages.graphql.ModeConfiguration,
  ): void {
    this._modeConfiguration = modeConfiguration || Object.create(null);
    this._onDidChange.fire(this);
  }

  setFormattingOptions(
    formattingOptions: monaco.languages.graphql.FormattingOptions,
  ): void {
    this._formattingOptions = formattingOptions || Object.create(null);
    this._onDidChange.fire(this);
  }
}

export const modeConfigurationDefault: Required<monaco.languages.graphql.ModeConfiguration> = {
  documentFormattingEdits: true,
  documentRangeFormattingEdits: false,
  completionItems: true,
  hovers: true,
  documentSymbols: false,
  tokens: false,
  colors: false,
  foldingRanges: false,
  diagnostics: true,
  selectionRanges: false,
};

export const schemaDefault: Required<monaco.languages.graphql.SchemaConfig> = {
  schema: 'http://localhost:8000',
  projects: [],
  documents: ['**.graphql'],
  schemaLoader: null,
};

export const formattingDefaults: Required<monaco.languages.graphql.FormattingOptions> = {
  prettierConfig: {
    tabsWidth: 5,
  },
};
