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
  defaultSchemaBuilder,
} from './schemaLoader';

export type GraphQLLanguageConfig = {
  parser?: typeof parse;
  schemaLoader?: typeof defaultSchemaLoader;
  schemaBuilder?: typeof defaultSchemaBuilder;
  schemaString?: string;
  parseOptions?: ParseOptions;
  schemaConfig: SchemaConfig;
};

export class LanguageService {
  private _parser: typeof parse = parse;
  private _schema: GraphQLSchema | null = null;
  private _schemaConfig: SchemaConfig;
  private _schemaResponse: SchemaResponse | null = null;
  private _schemaLoader: (
    schemaConfig: SchemaConfig,
  ) => Promise<SchemaResponse | null> = defaultSchemaLoader;
  private _schemaBuilder = defaultSchemaBuilder;
  private _schemaString: string | null = null;
  private _parseOptions: ParseOptions | undefined = undefined;
  constructor({
    parser,
    schemaLoader,
    schemaBuilder,
    schemaConfig,
    schemaString,
    parseOptions,
  }: GraphQLLanguageConfig) {
    this._schemaConfig = schemaConfig;
    if (parser) {
      this._parser = parser;
    }
    if (schemaLoader) {
      this._schemaLoader = schemaLoader;
    }
    if (schemaBuilder) {
      this._schemaBuilder = schemaBuilder;
    }
    if (schemaString) {
      this._schemaString = schemaString;
    }
    if (parseOptions) {
      this._parseOptions = parseOptions;
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

  /**
   * setSchema statically, ignoring URI
   * @param schema {schemaString}
   */
  public async setSchema(schema: string): Promise<void> {
    this._schemaString = schema;
    await this.loadSchema();
  }

  public async getSchemaResponse(): Promise<SchemaResponse | null> {
    if (this._schemaResponse) {
      return this._schemaResponse;
    }
    return this.loadSchemaResponse();
  }

  public async loadSchemaResponse(): Promise<SchemaResponse | null> {
    if (this._schemaString) {
      return typeof this._schemaString === 'string'
        ? this.parse(this._schemaString)
        : this._schemaString;
    }
    if (!this._schemaConfig?.uri) {
      return null;
    }
    this._schemaResponse = (await this._schemaLoader(
      this._schemaConfig,
    )) as SchemaResponse;
    return this._schemaResponse;
  }

  public async loadSchema() {
    const schemaResponse = await this.loadSchemaResponse();
    if (schemaResponse) {
      this._schema = this._schemaBuilder(
        schemaResponse,
        this._schemaConfig.buildSchemaOptions,
      ) as GraphQLSchema;
      return this._schema;
    } else {
      return null;
    }
  }

  public async parse(text: string, options?: ParseOptions) {
    return this._parser(text, options || this._parseOptions);
  }

  public getCompletion = async (
    _uri: string,
    documentText: string,
    position: Position,
  ) => {
    const schema = await this.getSchema();
    if (!schema) {
      return [];
    }
    return getAutocompleteSuggestions(schema, documentText, position);
  };

  public getDiagnostics = async (
    _uri: string,
    documentText: string,
    customRules?: ValidationRule[],
  ) => {
    const schema = await this.getSchema();
    if (!documentText || documentText.length < 1 || !schema) {
      return [];
    }
    return getDiagnostics(documentText, schema, customRules);
  };

  public getHover = async (
    _uri: string,
    documentText: string,
    position: Position,
  ) =>
    getHoverInformation(
      (await this.getSchema()) as GraphQLSchema,
      documentText,
      position,
    );
}
