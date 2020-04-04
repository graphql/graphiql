import * as monaco from 'monaco-editor';

import IRichLanguageConfiguration = monaco.languages.LanguageConfiguration;

import { WorkerManager } from './workerManager';
import { GraphQLWorker } from './graphql.worker';
import {
  LanguageServiceDefaultsImpl,
  LANGUAGE_ID,
  monarchLanguage,
} from './monaco.contribution';
import * as languageFeatures from './languageFeatures';
// @ts-ignore
import Uri = monaco.Uri;
import IDisposable = monaco.IDisposable;

export function setupMode(defaults: LanguageServiceDefaultsImpl): IDisposable {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];
  const client = new WorkerManager(defaults);
  // client.getLanguageServiceWorker()
  disposables.push(client);
  const worker: languageFeatures.WorkerAccessor = (
    ...uris: Uri[]
  ): Promise<GraphQLWorker> => {
    return client.getLanguageServiceWorker(...uris);
  };

  function registerProviders(): void {
    const { modeConfiguration } = defaults;
    disposeAll(providers);

    if (modeConfiguration.completionItems) {
      providers.push(
        monaco.languages.registerCompletionItemProvider(
          defaults.languageId,
          new languageFeatures.CompletionAdapter(worker),
        ),
      );
    }
    if (modeConfiguration.diagnostics) {
      providers.push(new languageFeatures.DiagnosticsAdapter(defaults, worker));
    }

    providers.push(monaco.languages.registerHoverProvider(defaults.languageId, new languageFeatures.HoverAdapter(worker)));
  }
  registerProviders();

  let modeConfiguration = defaults.modeConfiguration;

  defaults.onDidChange(
    // @ts-ignore
    (newDefaults: monaco.languages.graphql.LanguageServiceDefaultsImpl) => {
      if (newDefaults.modeConfiguration !== modeConfiguration) {
        modeConfiguration = newDefaults.modeConfiguration;
        registerProviders();
      }
    },
  );

  disposables.push(asDisposable(providers));

  return asDisposable(disposables);
}

function asDisposable(disposables: IDisposable[]): IDisposable {
  return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
  while (disposables.length) {
    disposables.pop()?.dispose();
  }
}

export const richLanguageConfig: IRichLanguageConfiguration = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"""', close: '"""', notIn: ['string', 'comment'] },
    { open: '"', close: '"', notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"""', close: '"""' },
    { open: '"', close: '"' },
  ],
  folding: {
    offSide: true,
  },
};

monaco.languages.setLanguageConfiguration(LANGUAGE_ID, richLanguageConfig);
monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchLanguage);
