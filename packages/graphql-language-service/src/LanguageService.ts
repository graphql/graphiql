/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import {
  parse,
  GraphQLSchema,
  ParseOptions,
  ValidationRule,
  FragmentDefinitionNode,
  visit,
} from 'graphql';
import type { IPosition } from 'graphql-language-service-types';
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
import { HoverConfig } from 'graphql-language-service-interface/src/getHoverInformation';

export type GraphQLLanguageConfig = {
  parser?: typeof parse;
  schemaLoader?: typeof defaultSchemaLoader;
  schemaBuilder?: typeof defaultSchemaBuilder;
  schemaString?: string;
  parseOptions?: ParseOptions;
  schemaConfig: SchemaConfig;
  exteralFragmentDefinitions?: FragmentDefinitionNode[] | string;
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
  private _exteralFragmentDefinitionNodes:
    | FragmentDefinitionNode[]
    | null = null;
  private _exteralFragmentDefinitionsString: string | null = null;
  constructor({
    parser,
    schemaLoader,
    schemaBuilder,
    schemaConfig,
    schemaString,
    parseOptions,
    exteralFragmentDefinitions,
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
    if (exteralFragmentDefinitions) {
      if (Array.isArray(exteralFragmentDefinitions)) {
        this._exteralFragmentDefinitionNodes = exteralFragmentDefinitions;
      } else {
        this._exteralFragmentDefinitionsString = exteralFragmentDefinitions;
      }
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

  public async getExternalFragmentDefinitions(): Promise<
    FragmentDefinitionNode[]
  > {
    if (
      !this._exteralFragmentDefinitionNodes &&
      this._exteralFragmentDefinitionsString
    ) {
      const definitionNodes: FragmentDefinitionNode[] = [];
      try {
        visit(await this._parser(this._exteralFragmentDefinitionsString), {
          FragmentDefinition(node) {
            definitionNodes.push(node);
          },
        });
      } catch (err) {
        throw Error(
          `Failed parsing exteralFragmentDefinitions string:\n${this._exteralFragmentDefinitionsString}`,
        );
      }

      this._exteralFragmentDefinitionNodes = definitionNodes;
    }
    return this._exteralFragmentDefinitionNodes as FragmentDefinitionNode[];
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
      this._schema = this._schemaBuilder(schemaResponse) as GraphQLSchema;
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
    position: IPosition,
  ) => {
    const schema = await this.getSchema();
    if (!documentText || documentText.length < 1 || !schema) {
      return [];
    }
    return getAutocompleteSuggestions(
      schema,
      documentText,
      position,
      undefined,
      await this.getExternalFragmentDefinitions(),
    );
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
    position: IPosition,
    options?: HoverConfig,
  ) =>
    getHoverInformation(
      (await this.getSchema()) as GraphQLSchema,
      documentText,
      position,
      undefined,
      { useMarkdown: true, ...options },
    );
}
