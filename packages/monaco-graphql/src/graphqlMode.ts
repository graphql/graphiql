/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { Uri, IDisposable } from 'monaco-editor';
import * as monaco from 'monaco-editor';

import { WorkerManager } from './workerManager';
import { GraphQLWorker } from './GraphQLWorker';

import {
  language as monarchLanguage,
  conf,
  // @ts-ignore
} from 'monaco-editor/esm/vs/basic-languages/graphql/graphql.js';

// console.log({ monarchLanguage })

import { LanguageServiceAPI } from './api';
import * as languageFeatures from './languageFeatures';

export function setupMode(defaults: LanguageServiceAPI): IDisposable {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];
  const client = new WorkerManager(defaults);
  const { languageId } = defaults;
  disposables.push(client);

  monaco.languages.setLanguageConfiguration(languageId, conf);
  monaco.languages.setMonarchTokensProvider(languageId, monarchLanguage);

  defaults.onSchemaLoaded(_api => {
    const worker: languageFeatures.WorkerAccessor = (
      ...uris: Uri[]
    ): Promise<GraphQLWorker> => {
      try {
        return client.getLanguageServiceWorker(...uris);
      } catch (err) {
        throw Error('Error fetching graphql language service worker');
      }
    };

    defaults.setWorker(worker);

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
        providers.push(
          new languageFeatures.DiagnosticsAdapter(defaults, worker),
        );
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
      if (defaults.schemaString !== newDefaults.schemaString) {
        registerProviders();
      }
      if (newDefaults.modeConfiguration !== modeConfiguration) {
        modeConfiguration = newDefaults.modeConfiguration;
        registerProviders();
      }
      if (newDefaults.schemaConfig !== schemaConfig) {
        schemaConfig = newDefaults.schemaConfig;
        registerProviders();
      }
      if (newDefaults.formattingOptions !== formattingOptions) {
        formattingOptions = newDefaults.formattingOptions;
        registerFormattingProvider();
      }
    });
    disposables.push(asDisposable(providers));
  });

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
