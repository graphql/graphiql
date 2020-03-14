import * as monaco from 'monaco-editor';

import IRichLanguageConfiguration = monaco.languages.LanguageConfiguration;

import { WorkerManager } from './workerManager';
import { GraphQLWorker } from './graphqlWorker';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import * as languageFeatures from './languageFeatures';

import Uri = monaco.Uri;
import IDisposable = monaco.IDisposable;

export function setupMode(defaults: LanguageServiceDefaultsImpl): IDisposable {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];

  const client = new WorkerManager(defaults);
  disposables.push(client);

  const worker: languageFeatures.WorkerAccessor = (
    ...uris: Uri[]
  ): Promise<GraphQLWorker> => {
    return client.getLanguageServiceWorker(...uris);
  };

  function registerProviders(): void {
    const { languageId, modeConfiguration } = defaults;

    disposeAll(providers);

    if (modeConfiguration.documentFormattingEdits) {
      providers.push(
        monaco.languages.registerDocumentFormattingEditProvider(
          languageId,
          new languageFeatures.DocumentFormattingEditProvider(worker),
        ),
      );
    }
    if (modeConfiguration.documentRangeFormattingEdits) {
      providers.push(
        monaco.languages.registerDocumentRangeFormattingEditProvider(
          languageId,
          new languageFeatures.DocumentRangeFormattingEditProvider(worker),
        ),
      );
    }
    if (modeConfiguration.completionItems) {
      providers.push(
        monaco.languages.registerCompletionItemProvider(
          languageId,
          new languageFeatures.CompletionAdapter(worker),
        ),
      );
    }
    if (modeConfiguration.hovers) {
      providers.push(
        monaco.languages.registerHoverProvider(
          languageId,
          new languageFeatures.HoverAdapter(worker),
        ),
      );
    }
    if (modeConfiguration.documentSymbols) {
      providers.push(
        monaco.languages.registerDocumentSymbolProvider(
          languageId,
          new languageFeatures.DocumentSymbolAdapter(worker),
        ),
      );
    }
    if (modeConfiguration.diagnostics) {
      providers.push(
        new languageFeatures.DiagnosticsAdapter(languageId, worker, defaults),
      );
    }
  }

  registerProviders();

  disposables.push(
    monaco.languages.setLanguageConfiguration(
      defaults.languageId,
      richLanguageConfig,
    ),
  );

  let modeConfiguration = defaults.modeConfiguration;
  defaults.onDidChange((newDefaults: LanguageServiceDefaultsImpl) => {
    if (newDefaults.modeConfiguration !== modeConfiguration) {
      modeConfiguration = newDefaults.modeConfiguration;
      registerProviders();
    }
  });

  disposables.push(asDisposable(providers));

  return asDisposable(disposables);
}

function asDisposable(disposables: IDisposable[]): IDisposable {
  return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
  while (disposables.length) {
    disposables.pop().dispose();
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
