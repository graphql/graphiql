import IWorkerContext = monaco.worker.IWorkerContext;

import * as graphqlService from 'graphql-languageservice';

import {
  GraphQLLanguageService,
  GraphQLCache,
} from 'graphql-language-service-interface';
import {
  Position,
  Diagnostic,
  CompletionItem,
} from 'graphql-language-service-types';

export class GraphQLWorker {
  private _ctx: IWorkerContext;
  private _languageService: GraphQLLanguageService;
  private _languageId: string;

  constructor(ctx: IWorkerContext, createData: ICreateData) {
    this._ctx = ctx;
    this._languageId = createData.languageId;
    this._languageService = new GraphQLLanguageService(new GraphQLCache());
  }

  async doValidation(uri: string): Promise<Diagnostic[]> {
    const query = this._getQueryText(uri);
    if (query) {
      return this._languageService.getDiagnostics(query, uri);
    }
    return Promise.resolve([]);
  }
  async doComplete(uri: string, position: Position): Promise<CompletionItem[]> {
    const query = this._getQueryText(uri);
    return this._languageService.getAutocompleteSuggestions(
      query,
      position,
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
