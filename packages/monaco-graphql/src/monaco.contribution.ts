// / <reference path="./monaco.d.ts"/>

import * as monaco from 'monaco-editor';

import * as mode from './graphqlMode';

import Emitter = monaco.Emitter;
import IEvent = monaco.IEvent;

// --- JSON configuration and defaults ---------

export class LanguageServiceDefaultsImpl
  implements
    // @ts-ignore
    monaco.languages.graphql.LanguageServiceDefaults {
  private _onDidChange = new Emitter<
    // @ts-ignore
    monaco.languages.graphql.LanguageServiceDefaults
  >();
  // @ts-ignore
  private _diagnosticsOptions: monaco.languages.graphql.DiagnosticsOptions;
  // @ts-ignore
  private _modeConfiguration: monaco.languages.graphql.ModeConfiguration;
  private _languageId: string;

  constructor(
    languageId: string,
    // @ts-ignore
    diagnosticsOptions: monaco.languages.graphql.DiagnosticsOptions,
    // @ts-ignore
    modeConfiguration: monaco.languages.graphql.ModeConfiguration,
  ) {
    this._languageId = languageId;
    this.setDiagnosticsOptions(diagnosticsOptions);
    this.setModeConfiguration(modeConfiguration);
  }
  // @ts-ignore
  get onDidChange(): IEvent<monaco.languages.graphql.LanguageServiceDefaults> {
    return this._onDidChange.event;
  }

  get languageId(): string {
    return this._languageId;
  }
  // @ts-ignore
  get modeConfiguration(): monaco.languages.graphql.ModeConfiguration {
    return this._modeConfiguration;
  }
  // @ts-ignore
  get diagnosticsOptions(): monaco.languages.graphql.DiagnosticsOptions {
    return this._diagnosticsOptions;
  }

  setDiagnosticsOptions(
    // @ts-ignore
    options: monaco.languages.graphql.DiagnosticsOptions,
  ): void {
    this._diagnosticsOptions = options || Object.create(null);
    this._onDidChange.fire(this);
  }

  setModeConfiguration(
    // @ts-ignore
    modeConfiguration: monaco.languages.graphql.ModeConfiguration,
  ): void {
    this._modeConfiguration = modeConfiguration || Object.create(null);
    this._onDidChange.fire(this);
  }
}

// @ts-ignore
const diagnosticDefault: Required<monaco.languages.graphql.DiagnosticsOptions> = {
  validate: true,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: true,
};

// @ts-ignore
const modeConfigurationDefault: Required<monaco.languages.graphql.ModeConfiguration> = {
  documentFormattingEdits: false,
  documentRangeFormattingEdits: false,
  completionItems: true,
  hovers: false,
  documentSymbols: false,
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

// @ts-ignore
monaco.languages.graphql = createAPI();

// --- Registration to monaco editor ---

function getMode(): Promise<typeof mode> {
  console.log('LOAD MODE');
  return import('./graphqlMode');
}

monaco.languages.register({
  id: 'graphql',
  extensions: ['.graphql'],
  aliases: ['graphql'],
  mimetypes: ['application/graphql'],
});

monaco.languages.onLanguage('graphql', () => {
  getMode()
    .then(thisMode => thisMode.setupMode(graphqlDefaults, 'graphql'))
    .catch(e => console.error(e));
});
