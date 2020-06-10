/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { FormattingOptions, ICreateData } from './typings';

import type { worker, editor, Position, IRange } from 'monaco-editor';

import {
  getRange,
  CompletionItem as GraphQLCompletionItem,
  LanguageService,
  GraphQLLanguageConfig,
  SchemaResponse,
} from 'graphql-language-service';

import {
  toGraphQLPosition,
  toMonacoRange,
  toMarkerData,
  toCompletion,
} from './utils';

import type { GraphQLSchema, DocumentNode } from 'graphql';

export type MonacoCompletionItem = monaco.languages.CompletionItem & {
  isDeprecated?: boolean;
  deprecationReason?: string | null;
};

export class GraphQLWorker {
  private _ctx: worker.IWorkerContext;
  private _languageService: LanguageService;
  private _formattingOptions: FormattingOptions | undefined;
  constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
    this._ctx = ctx;
    const serviceConfig: GraphQLLanguageConfig = {
      schemaConfig: createData.schemaConfig,
    };
    // if you must, we have a nice default schema loader at home
    if (createData.schemaLoader) {
      serviceConfig.schemaLoader = createData.schemaLoader;
    }
    this._languageService = new LanguageService(serviceConfig);
    this._formattingOptions = createData.formattingOptions;
  }

  async getSchemaResponse(_uri?: string): Promise<SchemaResponse> {
    return this._languageService.getSchemaResponse();
  }

  async loadSchema(_uri?: string): Promise<GraphQLSchema> {
    return this._languageService.getSchema();
  }

  async doValidation(uri: string): Promise<editor.IMarkerData[]> {
    const document = this._getTextDocument(uri);
    const graphqlDiagnostics = await this._languageService.getDiagnostics(
      uri,
      document,
    );
    return graphqlDiagnostics.map(toMarkerData);
  }

  async doComplete(
    uri: string,
    position: Position,
  ): Promise<(GraphQLCompletionItem & { range: IRange })[]> {
    const document = this._getTextDocument(uri);
    const graphQLPosition = toGraphQLPosition(position);

    const suggestions = await this._languageService.getCompletion(
      uri,
      document,
      graphQLPosition,
    );

    return suggestions.map(suggestion =>
      toCompletion(
        suggestion,
        getRange(
          {
            column: graphQLPosition.character,
            line: graphQLPosition.line + 1,
          },
          document,
        ),
      ),
    );
  }

  async doHover(uri: string, position: Position) {
    const document = this._getTextDocument(uri);
    const graphQLPosition = toGraphQLPosition(position);

    const hover = await this._languageService.getHover(
      uri,
      document,
      graphQLPosition,
    );

    return {
      content: hover,
      range: toMonacoRange(
        getRange(
          {
            column: graphQLPosition.character,
            line: graphQLPosition.line,
          },
          document,
        ),
      ),
    };
  }

  async doFormat(text: string): Promise<string> {
    const prettierStandalone = await import('prettier/standalone');
    const prettierGraphqlParser = await import('prettier/parser-graphql');

    return prettierStandalone.format(text, {
      ...this._formattingOptions,
      parser: 'graphql',
      plugins: [prettierGraphqlParser],
    });
  }

  async doParse(text: string): Promise<DocumentNode> {
    return this._languageService.parse(text);
  }

  private _getTextDocument(_uri: string): string {
    const models = this._ctx.getMirrorModels();
    if (models.length > 0) {
      return models[0].getValue();
    }
    return '';
  }
}
