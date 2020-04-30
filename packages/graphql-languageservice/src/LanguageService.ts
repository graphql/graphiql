/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { parse, GraphQLSchema, ParseOptions, ValidationRule } from 'graphql';
import type { Position } from 'graphql-language-service-types';
import {
  getAutocompleteSuggestions,
  getDiagnostics,
  getHoverInformation,
} from 'graphql-language-service-interface';

import {
  defaultSchemaLoader,
  SchemaConfig,
  SchemaResponse,
  buildSchemaFromResponse,
} from './schemaLoader';

export type GraphQLLspConfig = {
  parser?: typeof parse;
  schemaLoader?: typeof defaultSchemaLoader;
  schemaConfig: SchemaConfig;
};

export class LanguageService {
  private _parser: typeof parse = parse;
  private _schema: GraphQLSchema | null = null;
  private _schemaConfig: SchemaConfig;
  private _schemaResponse: SchemaResponse | null = null;
  private _schemaLoader: (
    schemaConfig: SchemaConfig,
  ) => Promise<SchemaResponse | void> = defaultSchemaLoader;

  constructor({ parser, schemaLoader, schemaConfig }: GraphQLLspConfig) {
    this._schemaConfig = schemaConfig;
    if (parser) {
      this._parser = parser;
    }
    if (schemaLoader) {
      this._schemaLoader = schemaLoader;
    }
  }

  public get schema() {
    return this._schema as GraphQLSchema;
  }

  public async getSchema() {
    if (this.schema) {
      return this.schema;
    }
    return this.loadSchema();
  }

  public async getSchemaResponse() {
    if (this._schemaResponse) {
      return this._schemaResponse;
    }
    return this.loadSchemaResponse();
  }

  public async loadSchemaResponse(): Promise<SchemaResponse> {
    if (!this._schemaConfig?.uri) {
      throw new Error('uri missing');
    }
    this._schemaResponse = (await this._schemaLoader(
      this._schemaConfig,
    )) as SchemaResponse;
    return this._schemaResponse;
  }

  public async loadSchema() {
    const schemaResponse = await this.loadSchemaResponse();
    this._schema = buildSchemaFromResponse(
      schemaResponse,
      this._schemaConfig.buildSchemaOptions,
    ) as GraphQLSchema;
    return this._schema;
  }

  public async parse(text: string, options?: ParseOptions) {
    return this._parser(text, options);
  }

  public getCompletion = async (
    _uri: string,
    documentText: string,
    position: Position,
  ) =>
    getAutocompleteSuggestions(await this.getSchema(), documentText, position);

  public getDiagnostics = async (
    _uri: string,
    documentText: string,
    customRules?: ValidationRule[],
  ) => getDiagnostics(documentText, await this.getSchema(), customRules);

  public getHover = async (
    _uri: string,
    documentText: string,
    position: Position,
  ) => getHoverInformation(await this.getSchema(), documentText, position);
}
