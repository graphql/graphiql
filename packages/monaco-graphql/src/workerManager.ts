import * as monaco from 'monaco-editor-core';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { GraphQLWorker } from './graphqlWorker';

import IDisposable = monaco.IDisposable;
import Uri = monaco.Uri;

const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min

export class WorkerManager {
  private _defaults: LanguageServiceDefaultsImpl;
  private _idleCheckInterval: number;
  private _lastUsedTime: number;
  private _configChangeListener: IDisposable;

  private _worker: monaco.editor.MonacoWebWorker<GraphQLWorker> | null;
  private _client: Promise<GraphQLWorker> | null;

  constructor(defaults: LanguageServiceDefaultsImpl) {
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

  private _getClient(): Promise<GraphQLWorker> {
    this._lastUsedTime = Date.now();

    if (!this._client) {
      this._worker = monaco.editor.createWebWorker<GraphQLWorker>({
        // module that exports the create() method and returns a `JSONWorker` instance
        moduleId: 'vs/language/json/jsonWorker',

        label: this._defaults.languageId,

        // passed in to the create() method
        createData: {
          languageSettings: this._defaults.diagnosticsOptions,
          languageId: this._defaults.languageId,
          enableSchemaRequest: this._defaults.diagnosticsOptions
            .enableSchemaRequest,
        },
      });

      this._client = <Promise<GraphQLWorker>>(<any>this._worker.getProxy());
    }

    return this._client;
  }

  getLanguageServiceWorker(...resources: Uri[]): Promise<GraphQLWorker> {
    let _client: GraphQLWorker;
    return this._getClient()
      .then(client => {
        _client = client;
      })
      .then(_ => {
        return this._worker!.withSyncedResources(resources);
      })
      .then(_ => _client);
  }
}
