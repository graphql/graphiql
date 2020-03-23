// / <reference path="./monaco.d.ts"/>

import * as monacoEditor from 'monaco-editor-core';

import * as mode from './graphqlMode';

import Emitter = monacoEditor.Emitter;
import IEvent = monacoEditor.IEvent;

// --- JSON configuration and defaults ---------

export class LanguageServiceDefaultsImpl
  implements monaco.languages.graphql.LanguageServiceDefaults {
  private _onDidChange = new Emitter<
    monaco.languages.graphql.LanguageServiceDefaults
  >();
  // @ts-ignore
  private _diagnosticsOptions: monaco.languages.graphql.DiagnosticsOptions;
  // @ts-ignore
  private _modeConfiguration: monaco.languages.graphql.ModeConfiguration;
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

  get onDidChange(): IEvent<monaco.languages.graphql.LanguageServiceDefaults> {
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

  setModeConfiguration(
    modeConfiguration: monaco.languages.graphql.ModeConfiguration,
  ): void {
    this._modeConfiguration = modeConfiguration || Object.create(null);
    this._onDidChange.fire(this);
  }
}

const diagnosticDefault: Required<monaco.languages.graphql.DiagnosticsOptions> = {
  validate: true,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: false,
};

const modeConfigurationDefault: Required<monaco.languages.graphql.ModeConfiguration> = {
  documentFormattingEdits: true,
  documentRangeFormattingEdits: true,
  completionItems: true,
  hovers: true,
  documentSymbols: true,
  tokens: true,
  colors: false,
  foldingRanges: false,
  diagnostics: true,
  selectionRanges: false,
};

const graphqlDefaults = new LanguageServiceDefaultsImpl(
  'graphql',
  diagnosticDefault,
  modeConfigurationDefault,
);

// Export API
function createAPI() {
  return {
    graphqlDefaults,
  };
}

monacoEditor.languages.graphql = createAPI();

// --- Registration to monaco editor ---

function getMode(): Promise<typeof mode> {
  return import('./graphqlMode');
}

monacoEditor.languages.register({
  id: 'graphql',
  extensions: ['.graphql'],
  aliases: ['graphql'],
  mimetypes: ['application/graphql'],
});

monacoEditor.languages.onLanguage('graphql', () => {
  getMode().then(mode => mode.setupMode(graphqlDefaults));
});
