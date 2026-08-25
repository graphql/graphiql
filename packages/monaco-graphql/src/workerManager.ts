/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { editor, IDisposable, Uri } from './monaco-editor';
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
  private _client: Promise<GraphQLWorker> | null = null;

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
        const {
          languageId,
          formattingOptions,
          schemas,
          externalFragmentDefinitions,
          completionSettings,
        } = this._defaults;
        const createData: ICreateData = {
          languageId,
          formattingOptions,
          diagnosticSettings: this._defaults.diagnosticSettings,
          // only string-based config can be passed from the main process
          languageConfig: {
            schemas: schemas?.map(getStringSchema),
            externalFragmentDefinitions,
            // TODO: make this overridable
            // MonacoAPI possibly another configuration object for this I think?
            // all of this could be organized better
            fillLeafsOnComplete:
              completionSettings.__experimental__fillLeafsOnComplete,
          },
        };
        // monaco-editor >= 0.53 no longer loads a worker module by `moduleId`
        // and no longer delivers `createData` through `editor.createWebWorker()`
        // (see microsoft/monaco-editor's worker loading rewrite). We now build
        // the worker ourselves via `MonacoEnvironment.getWorker` and configure
        // it explicitly once it's ready, via `GraphQLWorker#initialize`.
        const worker = MonacoEnvironment?.getWorker?.(
          'monaco-graphql/esm/GraphQLWorker.js',
          languageId,
        );
        if (!worker) {
          throw new Error(
            'monaco-graphql requires `MonacoEnvironment.getWorker` to be configured. ' +
              'See https://microsoft.github.io/monaco-editor/docs.html#functions/editor.createWebWorker.html',
          );
        }
        this._worker = editor.createWebWorker<GraphQLWorker>({ worker });
        const client = this._worker.getProxy();
        this._client = client;
        await client.then(resolved => resolved.initialize(createData));
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
