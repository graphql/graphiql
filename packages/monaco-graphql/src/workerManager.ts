/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { editor, IDisposable, Uri } from 'monaco-editor';
import { MonacoGraphQLAPI } from './api';
import { GraphQLWorker } from './GraphQLWorker';
import { ICreateData } from './typings';
import { getStringSchema } from './utils';

const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min

export class WorkerManager {
  private _defaults: MonacoGraphQLAPI;
  private _idleCheckInterval: number;
  private _lastUsedTime = 0;
  private _configChangeListener: IDisposable;
  private _worker: editor.MonacoWebWorker<GraphQLWorker> | null = null;
  private _client: GraphQLWorker | null = null;

  constructor(defaults: MonacoGraphQLAPI) {
    this._defaults = defaults;
    this._idleCheckInterval = window.setInterval(
      () => this._checkIfIdle(),
      30 * 1000,
    );
    // this is where we re-start the worker on config changes
    this._configChangeListener = this._defaults.onDidChange(() => {
      this._stopWorker();
    });
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
    if (!this._client && !this._worker) {
      try {
        this._worker = editor.createWebWorker<GraphQLWorker>({
          // module that exports the create() method and returns a `GraphQLWorker` instance
          moduleId: 'monaco-graphql/esm/GraphQLWorker.js',

          label: this._defaults.languageId,
          // passed in to the create() method
          createData: {
            languageId: this._defaults.languageId,
            formattingOptions: this._defaults.formattingOptions,
            // only string based config can be passed from the main process
            languageConfig: {
              schemas: this._defaults.schemas?.map(getStringSchema),
              externalFragmentDefinitions:
                this._defaults.externalFragmentDefinitions,
              // TODO: make this overridable
              // MonacoAPI possibly another configuration object for this I think?
              // all of this could be organized better
              fillLeafsOnComplete:
                this._defaults.completionSettings
                  .__experimental__fillLeafsOnComplete,
            },
          } as ICreateData,
        });
        this._client = await this._worker.getProxy();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('error loading worker', error);
      }
    }
    return this._client!;
  }

  async getLanguageServiceWorker(...resources: Uri[]): Promise<GraphQLWorker> {
    const client = await this._getClient();
    await this._worker!.withSyncedResources(resources);

    return client;
  }
}
