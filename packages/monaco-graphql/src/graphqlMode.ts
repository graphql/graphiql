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

import { MonacoGraphQLAPI } from './api';
import * as languageFeatures from './languageFeatures';

export function setupMode(defaults: MonacoGraphQLAPI): IDisposable {
  const disposables: IDisposable[] = [];
  const providers: IDisposable[] = [];
  const client = new WorkerManager(defaults);
  const { languageId } = defaults;
  disposables.push(client);

  monaco.languages.setLanguageConfiguration(languageId, conf);
  monaco.languages.setMonarchTokensProvider(languageId, monarchLanguage);

  // let initialLoad = true

  // let's avoid loading the language worker & providers until schema is present
  // TODO: eventually support schema-agnostic features here. Right now only formatting would be supported,
  // but the worker we create for that depends on schema.

  const worker: languageFeatures.WorkerAccessor = (
    ...uris: Uri[]
  ): Promise<GraphQLWorker> => {
    try {
      return client!.getLanguageServiceWorker(...uris);
    } catch (err) {
      throw Error('Error fetching graphql language service worker');
    }
  };

  // defaults.setWorker(worker);

  function registerSchemaLessProviders(newDefaults: MonacoGraphQLAPI): void {
    const { modeConfiguration } = newDefaults;
    if (modeConfiguration.documentFormattingEdits) {
      providers.push(
        monaco.languages.registerDocumentFormattingEditProvider(
          newDefaults.languageId,
          new languageFeatures.DocumentFormattingAdapter(worker),
        ),
      );
    }
  }

  function registerAllProviders(api: MonacoGraphQLAPI): void {
    const { modeConfiguration } = api;
    disposeAll(providers);

    if (modeConfiguration.completionItems) {
      providers.push(
        monaco.languages.registerCompletionItemProvider(
          api.languageId,
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
          api.languageId,
          new languageFeatures.HoverAdapter(worker),
        ),
      );
    }

    registerSchemaLessProviders(api);
  }

  defaults.onDidChange(newDefaults => {
    let { modeConfiguration, formattingOptions, schemaConfig } = defaults;
    if (newDefaults.modeConfiguration !== modeConfiguration) {
      modeConfiguration = newDefaults.modeConfiguration;
      registerAllProviders(newDefaults);
    }
    if (newDefaults.formattingOptions !== formattingOptions) {
      formattingOptions = newDefaults.formattingOptions;
      registerSchemaLessProviders(newDefaults);
    }
    if (newDefaults.schemaConfig !== schemaConfig) {
      schemaConfig = newDefaults.schemaConfig;
      registerAllProviders(newDefaults);
    }
  });
  /**
   * If a new schema loads, re-register the providers
   */
  defaults.onSchemaLoaded(api => {
    registerAllProviders(api);
  });

  /**
   * You can decide whether to loadSchemaOnChange. You can also do this yourself
   */
  defaults.onSchemaConfigChange(api => {
    if (api.schemaConfig.loadSchemaOnChange) {
      // don't register providers here!
      api.changeSchema();
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
