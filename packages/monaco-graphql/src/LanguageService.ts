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
  DocumentNode,
  Source,
} from 'graphql';

import picomatch from 'picomatch-browser';

import type { Diagnostic, IPosition } from 'graphql-language-service';
import {
  getAutocompleteSuggestions,
  getDiagnostics,
  getHoverInformation,
  HoverConfig,
  getVariablesJSONSchema,
  getOperationASTFacts,
  JSONSchemaOptions,
} from 'graphql-language-service';

import { defaultSchemaLoader } from './schemaLoader';

import { SchemaConfig, SchemaLoader, GraphQLLanguageConfig } from './typings';

type SchemaCacheItem = Omit<SchemaConfig, 'schema'> & { schema: GraphQLSchema };

type SchemaCache = Map<string, SchemaCacheItem>;
const schemaCache: SchemaCache = new Map();

/**
 * Currently only used by the `monaco-graphql` worker
 */
export class LanguageService {
  private _parser: typeof parse = parse;
  private _schemas: SchemaConfig[] = [];
  private _schemaCache: SchemaCache = schemaCache;
  private _schemaLoader: SchemaLoader = defaultSchemaLoader;
  private _parseOptions: ParseOptions | undefined = undefined;
  private _customValidationRules: ValidationRule[] | undefined = undefined;
  private _exteralFragmentDefinitionNodes:
    | FragmentDefinitionNode[]
    | null = null;
  private _exteralFragmentDefinitionsString: string | null = null;
  constructor({
    parser,
    schemas,
    parseOptions,
    exteralFragmentDefinitions,
    customValidationRules,
  }: GraphQLLanguageConfig) {
    this._schemaLoader = defaultSchemaLoader;
    if (schemas) {
      this._schemas = schemas;
      this._cacheSchemas();
    }
    if (parser) {
      this._parser = parser;
    }

    if (parseOptions) {
      this._parseOptions = parseOptions;
    }
    if (customValidationRules) {
      this._customValidationRules = customValidationRules;
    }
    if (exteralFragmentDefinitions) {
      if (Array.isArray(exteralFragmentDefinitions)) {
        this._exteralFragmentDefinitionNodes = exteralFragmentDefinitions;
      } else {
        this._exteralFragmentDefinitionsString = exteralFragmentDefinitions;
      }
    }
  }

  private _cacheSchemas() {
    this._schemas.forEach(schema => this._cacheSchema(schema));
  }

  private _cacheSchema(schemaConfig: SchemaConfig) {
    const schema = this._schemaLoader(schemaConfig, this.parse.bind(this));
    return this._schemaCache.set(schemaConfig.uri, {
      ...schemaConfig,
      schema,
    });
  }

  /**
   * Provide a model uri path, and see if a schema config has a `fileMatch` to match it
   * @param uri {string}
   * @returns {SchemaCacheItem | undefined}
   */
  public getSchemaForFile(uri: string): SchemaCacheItem | undefined {
    if (!this._schemas || !this._schemas.length) {
      return;
    }
    if (this._schemas.length === 1) {
      return this._schemaCache.get(this._schemas[0].uri);
    } else {
      const schema = this._schemas.find(schemaConfig => {
        if (!schemaConfig.fileMatch) {
          return false;
        }
        return schemaConfig.fileMatch.some(glob => {
          const isMatch = picomatch(glob);
          return isMatch(uri);
        });
      });
      if (schema) {
        const cacheEntry = this._schemaCache.get(schema.uri);
        if (cacheEntry) {
          return cacheEntry;
        }
        const cache = this._cacheSchema(schema);
        return cache.get(schema.uri);
      }
    }
  }

  public getExternalFragmentDefinitions(): FragmentDefinitionNode[] {
    if (
      !this._exteralFragmentDefinitionNodes &&
      this._exteralFragmentDefinitionsString
    ) {
      const definitionNodes: FragmentDefinitionNode[] = [];
      try {
        visit(this._parser(this._exteralFragmentDefinitionsString), {
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
   * override `schemas` config entirely
   * @param schema {schemaString}
   */
  public async updateSchemas(schemas: SchemaConfig[]): Promise<void> {
    this._schemas = schemas;
    this._cacheSchemas();
  }

  /**
   * overwrite an existing schema config by Uri string
   * @param schema {schemaString}
   */
  public updateSchema(schema: SchemaConfig): void {
    const schemaIndex = this._schemas.findIndex(c => c.uri === schema.uri);
    if (schemaIndex < 0) {
      console.warn(
        'updateSchema could not find a schema in your config by that URI',
        schema.uri,
      );
      return;
    }
    this._schemas[schemaIndex] = schema;
    this._cacheSchema(schema);
  }

  /**
   * add a schema to the config
   * @param schema {schemaString}
   */
  public addSchema(schema: SchemaConfig): void {
    this._schemas.push(schema);
    this._cacheSchema(schema);
  }
  /**
   * Uses the configured parser
   * @param text {string | Source}
   * @param options {ParseOptions}
   * @returns {DocumentNode}
   */
  public parse(text: string | Source, options?: ParseOptions): DocumentNode {
    return this._parser(text, options || this._parseOptions);
  }
  /**
   * get completion for the given uri and matching schema
   * @param uri
   * @param documentText
   * @param position
   * @returns
   */
  public getCompletion = (
    uri: string,
    documentText: string,
    position: IPosition,
  ) => {
    const schema = this.getSchemaForFile(uri);
    if (!documentText || documentText.length < 1 || !schema?.schema) {
      return [];
    }
    return getAutocompleteSuggestions(
      schema.schema,
      documentText,
      position,
      undefined,
      this.getExternalFragmentDefinitions(),
    );
  };
  /**
   * get diagnostics using graphql validation
   * @param uri
   * @param documentText
   * @param customRules
   * @returns
   */
  public getDiagnostics = (
    uri: string,
    documentText: string,
    customRules?: ValidationRule[],
  ): Diagnostic[] => {
    const schema = this.getSchemaForFile(uri);
    if (!documentText || documentText.length < 1 || !schema?.schema) {
      return [];
    }
    return getDiagnostics(
      documentText,
      schema.schema,
      customRules ?? this._customValidationRules,
      false,
      this.getExternalFragmentDefinitions(),
    );
  };

  public getHover = (
    uri: string,
    documentText: string,
    position: IPosition,
    options?: HoverConfig,
  ) => {
    const schema = this.getSchemaForFile(uri);
    if (schema && documentText?.length > 3) {
      return getHoverInformation(
        schema.schema,
        documentText,
        position,
        undefined,
        {
          useMarkdown: true,
          ...options,
        },
      );
    }
  };

  public getVariablesJSONSchema = (
    uri: string,
    documentText: string,
    options?: JSONSchemaOptions,
  ) => {
    const schema = this.getSchemaForFile(uri);
    if (schema && documentText.length > 3) {
      try {
        const documentAST = this.parse(documentText);
        const operationFacts = getOperationASTFacts(documentAST, schema.schema);
        if (operationFacts && operationFacts.variableToType) {
          return getVariablesJSONSchema(operationFacts.variableToType, options);
        }
      } catch (err) {}
    }
    return null;
  };
}
