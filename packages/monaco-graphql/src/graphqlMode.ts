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

import { MonacoGraphQLAPI } from './api';
import * as languageFeatures from './languageFeatures';

export function setupMode(defaults: MonacoGraphQLAPI): IDisposable {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];
  const client = new WorkerManager(defaults);
  disposables.push(client);

  const worker: languageFeatures.WorkerAccessor = (
    ...uris: Uri[]
  ): Promise<GraphQLWorker> => {
    try {
      return client!.getLanguageServiceWorker(...uris);
    } catch (err) {
      throw Error('Error fetching graphql language service worker');
    }
  };

  function registerSchemaLessProviders(): void {
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

  function registerAllProviders(api: MonacoGraphQLAPI): void {
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
      providers.push(new languageFeatures.DiagnosticsAdapter(api, worker));
    }
    if (modeConfiguration.hovers) {
      providers.push(
        monaco.languages.registerHoverProvider(
          defaults.languageId,
          new languageFeatures.HoverAdapter(worker),
        ),
      );
    }

    registerSchemaLessProviders();
  }
  let {
    modeConfiguration,
    formattingOptions,
    diagnosticSettings,
    externalFragmentDefinitions,
    schemas,
  } = defaults;

  registerAllProviders(defaults);

  defaults.onDidChange(newDefaults => {
    if (newDefaults.modeConfiguration !== modeConfiguration) {
      modeConfiguration = newDefaults.modeConfiguration;
      registerAllProviders(newDefaults);
    }
    if (newDefaults.formattingOptions !== formattingOptions) {
      formattingOptions = newDefaults.formattingOptions;
      registerSchemaLessProviders();
    }
    if (
      newDefaults.externalFragmentDefinitions !== externalFragmentDefinitions
    ) {
      externalFragmentDefinitions = newDefaults.externalFragmentDefinitions;
      registerAllProviders(newDefaults);
    }
    if (newDefaults.diagnosticSettings !== diagnosticSettings) {
      diagnosticSettings = newDefaults.diagnosticSettings;
      registerAllProviders(newDefaults);
    }
    if (newDefaults.schemas !== schemas) {
      schemas = newDefaults.schemas;
      registerAllProviders(newDefaults);
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
    disposables.pop()!.dispose();
  }
}
