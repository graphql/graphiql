import * as monaco from 'monaco-editor-core';

import IWorkerContext = monaco.worker.IWorkerContext;

import * as graphqlService from 'graphql-languageservice';

import { Diagnostic, CompletionItem } from 'graphql-language-service-types';

import { Position } from 'graphql-language-service-utils';

export class GraphQLWorker {
  private _ctx: IWorkerContext;
  private _languageService: graphqlService.GraphQLLanguageService;
  private _languageId: string;

  constructor(ctx: IWorkerContext, createData: ICreateData) {
    this._ctx = ctx;
    this._languageId = createData.languageId;
    this._languageService = new graphqlService.GraphQLLanguageService(
      new graphqlService.GraphQLCache(),
    );
  }

  async doValidation(uri: string): Promise<Diagnostic[]> {
    const query = this._getQueryText(uri);
    if (query) {
      return this._languageService.getDiagnostics(query, uri);
    }
    return Promise.resolve([]);
  }
  async doComplete(
    uri: string,
    position: monaco.Position,
  ): Promise<CompletionItem[]> {
    const query = this._getQueryText(uri);
    const graphQLPosition = new Position(
      position.lineNumber - 1,
      position.column - 1,
    );
    return this._languageService.getAutocompleteSuggestions(
      query,
      graphQLPosition,
      uri,
    );
  }

  async reloadSchema(uri: string): Promise<boolean> {
    // TODO@acao, rebornix
    // return this._languageService.getConfigForURI(uri).getSchema();
    return false;
  }

  resetSchema(uri: string) {}

  private _getQueryText(uri: string): string {
    // TODO@acao, rebornix

    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      if (model.uri.toString() === uri) {
        return model.getValue();
      }
    }
    return null;
  }
}

export interface ICreateData {
  languageId: string;
  enableSchemaRequest: boolean;
}

export function create(
  ctx: IWorkerContext,
  createData: ICreateData,
): GraphQLWorker {
  return new GraphQLWorker(ctx, createData);
}
