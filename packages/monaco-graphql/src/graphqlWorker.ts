import * as monaco from 'monaco-editor';

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
    const document = this._getTextDocument(uri);
    if (document) {
      return this._languageService.getDiagnostics(document, uri);
    }
    return Promise.resolve([]);
  }
  async doComplete(uri: string, position: Position): Promise<CompletionItem[]> {
    const document = this._getTextDocument(uri);
    return this._languageService.getAutocompleteSuggestions(
      document,
      position,
      uri,
    );
  }

  async doHover(
    uri: string,
    position: graphqlService.Position,
  ): Promise<graphqlService.Hover> {
    const document = this._getTextDocument(uri);
    return this._languageService.getHoverInformation(document, position, uri);
  }
  async format(
    uri: string,
    range: graphqlService.Range,
    options: graphqlService.FormattingOptions,
  ): Promise<graphqlService.TextEdit[]> {
    const document = this._getTextDocument(uri);
    const textEdits = this._languageService.format(document, range, options);
    return Promise.resolve(textEdits);
  }
  async reloadSchema(uri: string): Promise<boolean> {
    return this._languageService.getConfigForURI(uri).getSchema();
  }
  async findDocumentSymbols(
    uri: string,
  ): Promise<graphqlService.SymbolInformation[]> {
    const document = this._getTextDocument(uri);
    const symbols = this._languageService.getDocumentSymbols(document, uri);
    return Promise.resolve(symbols);
  }
  // async getSelectionRanges(uri: string, positions: graphqlService.Position[]): Promise<graphqlService.SelectionRange[]> {
  //     const document = this._getTextDocument(uri);
  //     const ranges = this._languageService.getSelectionRanges(document, positions, uri);
  //     return Promise.resolve(ranges);
  // }
  private _getTextDocument(uri: string): graphqlService.TextDocument {
    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      if (model.uri.toString() === uri) {
        return graphqlService.TextDocument.create(
          uri,
          this._languageId,
          model.version,
          model.getValue(),
        );
      }
    }
    return null;
  }
}

export interface ICreateData {
  languageId: string;
  languageSettings: graphqlService.LanguageSettings;
  enableSchemaRequest: boolean;
}

export function create(
  ctx: IWorkerContext,
  createData: ICreateData,
): GraphQLWorker {
  return new GraphQLWorker(ctx, createData);
}
