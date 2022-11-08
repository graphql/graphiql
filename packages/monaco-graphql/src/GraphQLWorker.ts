/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { FormattingOptions, ICreateData, SchemaConfig } from './typings';

import type { worker, Position } from 'monaco-editor';

import { getRange } from 'graphql-language-service';

import { LanguageService } from './LanguageService';

import {
  toGraphQLPosition,
  toMonacoRange,
  toMarkerData,
  toCompletion,
  GraphQLWorkerCompletionItem,
} from './utils';

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
    this._languageService = new LanguageService(createData.languageConfig);
    this._formattingOptions = createData.formattingOptions;
  }

  public doValidation(uri: string) {
    try {
      const documentModel = this._getTextModel(uri);
      const document = documentModel?.getValue();
      if (!document) {
        return [];
      }
      const graphqlDiagnostics = this._languageService.getDiagnostics(
        uri,
        document,
      );
      return graphqlDiagnostics.map(toMarkerData);
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public doComplete(
    uri: string,
    position: Position,
  ): GraphQLWorkerCompletionItem[] {
    try {
      const documentModel = this._getTextModel(uri);
      const document = documentModel?.getValue();
      if (!document) {
        return [];
      }
      const graphQLPosition = toGraphQLPosition(position);
      const suggestions = this._languageService.getCompletion(
        uri,
        document,
        graphQLPosition,
      );
      return suggestions.map(suggestion => toCompletion(suggestion));
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public doHover(uri: string, position: Position) {
    try {
      const documentModel = this._getTextModel(uri);
      const document = documentModel?.getValue();
      if (!document) {
        return null;
      }
      const graphQLPosition = toGraphQLPosition(position);

      const hover = this._languageService.getHover(
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
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public doGetVariablesJSONSchema(uri: string): unknown {
    const documentModel = this._getTextModel(uri);
    const document = documentModel?.getValue();
    if (!documentModel || !document) {
      return null;
    }
    const jsonSchema = this._languageService.getVariablesJSONSchema(
      uri,
      document,
      { useMarkdownDescription: true },
    );
    if (jsonSchema) {
      jsonSchema.$id = 'monaco://variables-schema.json';
      jsonSchema.title = 'GraphQL Variables';
      return jsonSchema;
    }

    return null;
  }

  async doFormat(uri: string): Promise<string | null> {
    const documentModel = this._getTextModel(uri);
    const document = documentModel?.getValue();
    if (!documentModel || !document) {
      return null;
    }
    const prettierStandalone = await import('prettier/standalone');
    const prettierGraphqlParser = await import('prettier/parser-graphql');

    return prettierStandalone.format(document, {
      parser: 'graphql',
      plugins: [prettierGraphqlParser],
      ...this._formattingOptions?.prettierConfig,
    });
  }

  /**
   * TODO: store this in a proper document cache in the language service
   */
  private _getTextModel(uri: string): monaco.worker.IMirrorModel | null {
    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      if (model.uri.toString() === uri) {
        return model;
      }
    }
    return null;
  }
  public doUpdateSchema(schema: SchemaConfig) {
    return this._languageService.updateSchema(schema);
  }
  public doUpdateSchemas(schemas: SchemaConfig[]) {
    return this._languageService.updateSchemas(schemas);
  }
}

export default {
  GraphQLWorker,
};

export function create(
  ctx: worker.IWorkerContext,
  createData: ICreateData,
): GraphQLWorker {
  return new GraphQLWorker(ctx, createData);
}
