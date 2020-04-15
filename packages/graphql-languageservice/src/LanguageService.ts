/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { loadSchema } from '@graphql-toolkit/core';
import { UrlLoader } from '@graphql-toolkit/url-loader';
import { Loader, SingleFileOptions } from '@graphql-toolkit/common';
import { parse, GraphQLSchema, ParseOptions } from 'graphql';
import { Position } from 'graphql-language-service-types';
import * as graphqlLS from 'graphql-language-service-interface';

type LSPConfig = {
  uri: string;
  parser?: typeof parse;
  schemaLoaders?: Loader<string, SingleFileOptions>[];
};

export class LanguageService {
  private _parser: typeof parse;
  private _uri: string;
  private _schema: GraphQLSchema | null;
  private _schemaLoaders: Loader<string, SingleFileOptions>[];

  constructor({ uri, parser, schemaLoaders }: LSPConfig) {
    this._uri = uri;
    this._parser = parser || parse;
    this._schema = null;
    this._schemaLoaders = schemaLoaders || [new UrlLoader()];
  }

  public get schema() {
    return this._schema as GraphQLSchema;
  }

  async getSchema() {
    if (this.schema) {
      return this.schema;
    }
    return this.loadSchema();
  }

  async loadSchema() {
    if (!this._uri) {
      throw new Error('uri missing');
    }
    const schema = await loadSchema(this._uri, {
      // load from endpoint
      loaders: this._schemaLoaders,
    });
    this._schema = schema;
    return schema;
  }

  async parse(text: string, options?: ParseOptions) {
    return this._parser(text, options);
  }

  getCompletion = async (
    _uri: string,
    documentText: string,
    position: Position,
  ) =>
    graphqlLS.getAutocompleteSuggestions(
      await this.getSchema(),
      documentText,
      position,
    );

  getDiagnostics = async (_uri: string, documentText: string) =>
    graphqlLS.getDiagnostics(documentText, await this.getSchema());

  getHover = async (_uri: string, documentText: string, position: Position) =>
    graphqlLS.getHoverInformation(
      await this.getSchema(),
      documentText,
      position,
    );
}
