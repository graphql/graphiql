/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import {
  parse,
  GraphQLSchema,
  ParseOptions,
  ValidationRule,
  BuildSchemaOptions,
  IntrospectionOptions,
} from 'graphql';
import type { Position } from 'graphql-language-service-types';
import {
  getAutocompleteSuggestions,
  getDiagnostics,
  getHoverInformation,
} from 'graphql-language-service-interface';

import {
  SchemaLoader,
  SchemaResponse,
  buildSchemaFromResponse,
} from './schemaLoader';
import { QueryExecutorArgs, QueryExecutor, Json } from 'queryExecutor';

export type GraphQLLspConfig = {
  parser?: typeof parse;
  schemaLoader: SchemaLoader;
  queryExecutor?: QueryExecutor;
  buildSchemaOptions?: BuildSchemaOptions;
  introspectionOptions?: IntrospectionOptions;
};

export class LanguageService {
  private _parser: typeof parse = parse;
  private _schema: GraphQLSchema | null = null;
  private _schemaResponse: SchemaResponse | null = null;
  protected _schemaLoader: SchemaLoader;
  protected _queryExecutor?: QueryExecutor;
  private _buildSchemaOptions?: BuildSchemaOptions;

  constructor({
    parser,
    schemaLoader,
    queryExecutor,
    buildSchemaOptions,
  }: GraphQLLspConfig) {
    if (parser) {
      this._parser = parser;
    }

    this._schemaLoader = schemaLoader;
    this._queryExecutor = queryExecutor;
    this._buildSchemaOptions = buildSchemaOptions;
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
    this._schemaResponse = (await this._schemaLoader()) as SchemaResponse;
    return this._schemaResponse;
  }

  public async loadSchema() {
    const schemaResponse = await this.loadSchemaResponse();
    this._schema = buildSchemaFromResponse(
      schemaResponse,
      this._buildSchemaOptions,
    ) as GraphQLSchema;
    return this._schema;
  }

  public async executeQuery(args: QueryExecutorArgs): Promise<Json> {
    if (!this._queryExecutor) {
      throw new Error('Query Executor Not Supplied');
    }
    return this._queryExecutor(args);
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
