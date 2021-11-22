/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { buildASTSchema, printSchema } from 'graphql';
import { editor as monacoEditor } from 'monaco-editor';
import { MonacoGraphQLAPI } from './api';
import { GraphQLWorker } from './GraphQLWorker';

import IDisposable = monaco.IDisposable;
import Uri = monaco.Uri;
import { ICreateData } from './typings';
import type { SchemaConfig } from 'graphql-language-service';

const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000; // 2min

export class WorkerManager {
  private _defaults: MonacoGraphQLAPI;
  private _idleCheckInterval: number;
  private _lastUsedTime: number;
  private _configChangeListener: IDisposable;
  private _worker: monaco.editor.MonacoWebWorker<GraphQLWorker> | null;
  private _client: GraphQLWorker | null;

  constructor(defaults: MonacoGraphQLAPI) {
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

  /**
   * Send the most minimal string representation
   * to the worker for language service instantiation
   */
  private getStringSchema = (schemaConfig: SchemaConfig) => {
    const {
      schema: graphQLSchema,
      documentAST,
      introspectionJSON,
      introspectionJSONString,
      documentString,
      ...rest
    } = schemaConfig;
    if (graphQLSchema) {
      return {
        ...rest,
        documentString: printSchema(graphQLSchema),
      };
    }
    if (introspectionJSONString) {
      return {
        ...rest,
        introspectionJSONString,
      };
    }
    if (documentString) {
      return {
        ...rest,
        documentString,
      };
    }
    if (introspectionJSON) {
      return {
        ...rest,
        introspectionJSONString: JSON.stringify(introspectionJSON),
      };
    }

    if (documentAST) {
      const schema = buildASTSchema(documentAST, rest.buildSchemaOptions);
      return {
        ...rest,
        documentString: printSchema(schema),
      };
    }
    throw Error('no schema supplied');
  };

  private async _getClient(): Promise<GraphQLWorker> {
    this._lastUsedTime = Date.now();
    if (!this._client) {
      try {
        this._worker = monacoEditor.createWebWorker<GraphQLWorker>({
          // module that exports the create() method and returns a `GraphQLWorker` instance
          moduleId: 'monaco-graphql/esm/GraphQLWorker.js',

          label: this._defaults.languageId,
          // passed in to the create() method
          createData: {
            languageId: this._defaults.languageId,
            formattingOptions: this._defaults.formattingOptions,
            languageConfig: {
              schemas: this._defaults.schemas?.map(this.getStringSchema),
              exteralFragmentDefinitions: this._defaults
                .externalFragmentDefinitions,
            },
          } as ICreateData,
        });
        this._client = await this._worker.getProxy();
      } catch (error) {
        console.error('error loading worker', error);
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
