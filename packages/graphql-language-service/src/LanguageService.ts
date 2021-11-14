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
  // introspectionFromSchema,
  IntrospectionQuery,
} from 'graphql';
import type { IPosition } from 'graphql-language-service-types';
import {
  getAutocompleteSuggestions,
  getDiagnostics,
  getHoverInformation,
  HoverConfig
} from 'graphql-language-service-interface';
import {
  defaultSchemaLoader,
  SchemaConfig,
} from './schemaLoader';

import {
  getVariablesJSONSchema,
  getOperationASTFacts,
} from 'graphql-language-service-utils';

export type GraphQLLanguageConfig = {
  parser?: typeof parse;
  jsonParser?: typeof JSON.parse;
  schemaLoader?: typeof defaultSchemaLoader;
  parseOptions?: ParseOptions;
  schemaConfig: SchemaConfig;
  exteralFragmentDefinitions?: FragmentDefinitionNode[] | string;
};

export class LanguageService {
  private _parser: typeof parse = parse;
  // private _jsonParser: typeof JSON.parse;
  private _schemaConfig: SchemaConfig;
  private _schemaLoader: typeof defaultSchemaLoader = defaultSchemaLoader;
  private _parseOptions: ParseOptions | undefined = undefined;
  private _exteralFragmentDefinitionNodes:
    | FragmentDefinitionNode[]
    | null = null;
  private _exteralFragmentDefinitionsString: string | null = null;
  constructor({
    parser,
    // jsonParser,
    schemaLoader,
    schemaConfig,
    parseOptions,
    exteralFragmentDefinitions,
  }: GraphQLLanguageConfig) {
    this._schemaConfig = schemaConfig;
    if (parser) {
      this._parser = parser;
    }
    // if(jsonParser) {
    //   this._jsonParser = jsonParser
    // }
    if (schemaLoader) {
      this._schemaLoader = schemaLoader;
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
    return this._schemaConfig.schema;
  }

  public get schemaConfig() {
    return this._schemaConfig;
  }

  public get introspectionJSON(): IntrospectionQuery {
    return this._schemaConfig.introspectionJSON!;
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
  public async setSchema(schema: GraphQLSchema): Promise<void> {
    this._schemaConfig.schema = schema;
    await this.loadSchema();
  }

  public async loadSchema(): Promise<GraphQLSchema | null> {
    const result = await this._schemaLoader(this._schemaConfig, this.parse);
    if (result?.schema) {
      this._schemaConfig.schema = result.schema;
      if (result.introspectionJSON && !result.introspectionJSONString) {
        this._schemaConfig.introspectionJSON = result.introspectionJSON;
        this._schemaConfig.introspectionJSONString = JSON.stringify(
          result.introspectionJSONString,
        );
      } else if (result.introspectionJSONString) {
        this._schemaConfig.introspectionJSON = JSON.parse(
          result.introspectionJSONString,
        );
        this._schemaConfig.introspectionJSONString =
          result.introspectionJSONString;
      }
    }

    return this._schemaConfig.schema ?? null;
  }

  public parse(text: string, options?: ParseOptions) {
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
  // todo: use uri arguments in the metheods below to read from a document cache? however json lang service's
  // document cache is actually instantiated in monaco-json using ctx._getMirrorModels()
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

  public getVariablesJSONSchema = async (
    _uri: string,
    documentText: string,
  ) => {
    const schema = await this.getSchema();
    if (schema && documentText.length > 3) {
      try {
        const documentAST = await this.parse(documentText);
        const operationFacts = getOperationASTFacts(documentAST, schema);
        if (operationFacts && operationFacts.variableToType) {
          return getVariablesJSONSchema(operationFacts.variableToType);
        }
      } catch (err) {}
    }
    return null;
  };
}
