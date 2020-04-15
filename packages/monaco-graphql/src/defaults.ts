/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import * as monacoEditor from 'monaco-editor';

export class LanguageServiceDefaultsImpl
  implements monaco.languages.graphql.LanguageServiceDefaults {
  // @ts-ignore
  private _onDidChange = new monacoEditor.Emitter<
    monaco.languages.graphql.LanguageServiceDefaults
  >();
  private _diagnosticsOptions!: monaco.languages.graphql.DiagnosticsOptions;
  private _modeConfiguration!: monaco.languages.graphql.ModeConfiguration;
  private _languageId: string;

  constructor(
    languageId: string,
    diagnosticsOptions: monaco.languages.graphql.DiagnosticsOptions,
    modeConfiguration: monaco.languages.graphql.ModeConfiguration,
  ) {
    this._languageId = languageId;
    this.setDiagnosticsOptions(diagnosticsOptions);
    this.setModeConfiguration(modeConfiguration);
  }
  // @ts-ignore
  get onDidChange(): monaco.IEvent<
    monaco.languages.graphql.LanguageServiceDefaults
  > {
    return this._onDidChange.event;
  }

  get languageId(): string {
    return this._languageId;
  }
  get modeConfiguration(): monaco.languages.graphql.ModeConfiguration {
    return this._modeConfiguration;
  }
  get diagnosticsOptions(): monaco.languages.graphql.DiagnosticsOptions {
    return this._diagnosticsOptions;
  }

  setDiagnosticsOptions(
    options: monaco.languages.graphql.DiagnosticsOptions,
  ): void {
    this._diagnosticsOptions = options || Object.create(null);
    this._onDidChange.fire(this);
  }

  setSchemaUri(schemaUri: string): void {
    this.setDiagnosticsOptions({ ...this.diagnosticsOptions, schemaUri });
    this._onDidChange.fire(this);
  }

  setModeConfiguration(
    modeConfiguration: monaco.languages.graphql.ModeConfiguration,
  ): void {
    this._modeConfiguration = modeConfiguration || Object.create(null);
    this._onDidChange.fire(this);
  }
}

export const diagnosticDefault: Required<monaco.languages.graphql.DiagnosticsOptions> = {
  validate: true,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: true,
  schemaUri: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
};

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
