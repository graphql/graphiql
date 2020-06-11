/* global monaco */
/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { editor as monacoEditor } from 'monaco-editor/esm/vs/editor/editor.api';
import { LanguageServiceAPI } from './api';
import { GraphQLWorker } from './GraphQLWorker';

import IDisposable = monaco.IDisposable;
import Uri = monaco.Uri;
import { ICreateData } from './typings';

const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min

export class WorkerManager {
  private _defaults: LanguageServiceAPI;
  private _idleCheckInterval: number;
  private _lastUsedTime: number;
  private _configChangeListener: IDisposable;

  private _worker: monaco.editor.MonacoWebWorker<GraphQLWorker> | null;
  private _client: GraphQLWorker | null;

  constructor(defaults: LanguageServiceAPI) {
    this._defaults = defaults;
    this._worker = null;
    this._idleCheckInterval = (setInterval(
      () => this._checkIfIdle(),
      30 * 1000,
    ) as unknown) as number;
    this._lastUsedTime = 0;
    this._configChangeListener = this._defaults.onDidChange(() =>
      this._stopWorker(),
    );
    this._client = null;
  }

  private _stopWorker(): void {
    if (this._worker) {
      this._worker.dispose();
      this._worker = null;
    }
    this._client = null;
  }

  dispose(): void {
    clearInterval(this._idleCheckInterval);
    this._configChangeListener.dispose();
    this._stopWorker();
  }

  private _checkIfIdle(): void {
    if (!this._worker) {
      return;
    }
    const timePassedSinceLastUsed = Date.now() - this._lastUsedTime;
    if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
      this._stopWorker();
    }
  }

  private async _getClient(): Promise<GraphQLWorker> {
    this._lastUsedTime = Date.now();

    if (!this._client) {
      this._worker = monacoEditor.createWebWorker<GraphQLWorker>({
        // module that exports the create() method and returns a `GraphQLWorker` instance
        moduleId: 'vs/language/graphql/graphqlWorker',

        label: this._defaults.languageId,
        // passed in to the create() method
        createData: {
          languageId: this._defaults.languageId,
          formattingOptions: this._defaults.formattingOptions,
          languageConfig: {
            schemaConfig: this._defaults.schemaConfig,
          },
        } as ICreateData,
      });
      try {
        this._client = await this._worker.getProxy();
      } catch (error) {
        throw Error('Error loading serviceworker proxy');
      }
    }
    return this._client as GraphQLWorker;
  }

  async getLanguageServiceWorker(...resources: Uri[]): Promise<GraphQLWorker> {
    const client = await this._getClient();
    await this._worker!.withSyncedResources(resources);
    return client;
  }
}
