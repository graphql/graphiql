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

        // monaco-editor 0.53+ では worker パラメータが必須
        // MonacoEnvironment.getWorker() から Worker インスタンスを取得
        const workerInstance = globalThis.MonacoEnvironment?.getWorker?.(
          'monaco-graphql/esm/graphql.worker.js',
          languageId,
        );

        if (!workerInstance) {
          throw new Error(
            'MonacoEnvironment.getWorker() must be configured to return a GraphQL worker instance. ' +
              'Please set up MonacoEnvironment.getWorker() to handle the "graphql" label.',
          );
        }

        this._worker = editor.createWebWorker<GraphQLWorker>({
          worker:
            workerInstance instanceof Promise
              ? workerInstance
              : Promise.resolve(workerInstance),
        });

        // Worker の初期化データを送信
        const createData: ICreateData = {
          languageId,
          formattingOptions,
          languageConfig: {
            schemas: schemas?.map(getStringSchema),
            externalFragmentDefinitions,
            fillLeafsOnComplete:
              completionSettings.__experimental__fillLeafsOnComplete,
          },
          diagnosticSettings: this._defaults.diagnosticSettings,
        };

        // Proxy を取得して初期化
        this._client = this._worker.getProxy().then(async proxy => {
          // スキーマ設定を Worker に送信
          if (createData.languageConfig.schemas) {
            await proxy.doUpdateSchemas(createData.languageConfig.schemas);
          }
          return proxy;
        });
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
