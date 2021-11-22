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

  function registerAllProviders(): void {
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

    registerSchemaLessProviders();
  }
  let {
    modeConfiguration,
    formattingOptions,
    schemas,
    diagnosticSettings,
    externalFragmentDefinitions,
  } = defaults;

  defaults.onDidChange(async newDefaults => {
    if (newDefaults.modeConfiguration !== modeConfiguration) {
      modeConfiguration = newDefaults.modeConfiguration;
      registerAllProviders();
    }
    if (newDefaults.formattingOptions !== formattingOptions) {
      formattingOptions = newDefaults.formattingOptions;
      registerSchemaLessProviders();
    }
    if (newDefaults.schemas !== schemas) {
      if (newDefaults.schemas) {
        const _worker = await worker();
        await _worker.doUpdateSchemas(newDefaults.schemas);
        schemas = newDefaults.schemas;
        registerAllProviders();
      }
    }
    if (
      newDefaults.externalFragmentDefinitions !== externalFragmentDefinitions
    ) {
      externalFragmentDefinitions = newDefaults.externalFragmentDefinitions;
      registerAllProviders();
    }
    if (newDefaults.diagnosticSettings !== diagnosticSettings) {
      diagnosticSettings = newDefaults.diagnosticSettings;
      registerAllProviders();
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
