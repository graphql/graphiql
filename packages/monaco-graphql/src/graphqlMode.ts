/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Uri, IDisposable } from 'monaco-editor';

import IRichLanguageConfiguration = monaco.languages.LanguageConfiguration;

import { WorkerManager } from './workerManager';
import { GraphQLWorker } from './GraphQLWorker';

// @ts-ignore
import { language as monarchLanguage } from 'monaco-editor/esm/vs/basic-languages/graphql/graphql';

import { LanguageServiceDefaultsImpl } from './defaults';
import * as languageFeatures from './languageFeatures';
import { MonacoGraphQLApi } from './api';

export function setupMode(defaults: LanguageServiceDefaultsImpl): IDisposable {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];
  const client = new WorkerManager(defaults);
  const { languageId } = defaults;
  // client.getLanguageServiceWorker()
  disposables.push(client);
  const worker: languageFeatures.WorkerAccessor = (
    ...uris: Uri[]
  ): Promise<GraphQLWorker> => {
    try {
      return client.getLanguageServiceWorker(...uris);
    } catch (err) {
      throw Error('Error fetching graphql language service worker');
    }
  };
  // @ts-ignore
  monaco.languages.graphql.api = new MonacoGraphQLApi({ accessor: worker });
  // @ts-ignore
  console.log(monaco.languages.graphql.api.getSchema);

  monaco.languages.setLanguageConfiguration(languageId, richLanguageConfig);
  monaco.languages.setMonarchTokensProvider(languageId, monarchLanguage);

  function registerFormattingProvider(): void {
    const { modeConfiguration } = defaults;
    if (modeConfiguration.documentFormattingEdits) {
      providers.push(
        monaco.languages.registerDocumentFormattingEditProvider(
          defaults.languageId,
          new languageFeatures.DocumentFormattingAdapter(worker),
        ),
      );
    }
  }

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
    if (modeConfiguration.hovers) {
      providers.push(
        monaco.languages.registerHoverProvider(
          defaults.languageId,
          new languageFeatures.HoverAdapter(worker),
        ),
      );
    }

    registerFormattingProvider();
  }

  registerProviders();

  let { modeConfiguration, schemaConfig, formattingOptions } = defaults;

  defaults.onDidChange(newDefaults => {
    console.log({ newDefaults });
    if (newDefaults.modeConfiguration !== modeConfiguration) {
      modeConfiguration = newDefaults.modeConfiguration;
      registerProviders();
    }
    if (newDefaults.schemaConfig !== schemaConfig) {
      console.log('new schema opts');
      schemaConfig = newDefaults.schemaConfig;
      registerProviders();
    }
    if (newDefaults.formattingOptions !== formattingOptions) {
      formattingOptions = newDefaults.formattingOptions;
      registerFormattingProvider();
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
