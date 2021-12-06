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
} from 'graphql';

import { default as picomatch } from 'picomatch';

import type { IPosition } from 'graphql-language-service-types';
import {
  getAutocompleteSuggestions,
  getDiagnostics,
  getHoverInformation,
  HoverConfig,
} from 'graphql-language-service-interface';

import {
  getVariablesJSONSchema,
  getOperationASTFacts,
  JSONSchemaOptions,
} from 'graphql-language-service-utils';

import {
  defaultSchemaLoader,
  SchemaConfig,
  SchemaLoader,
} from './schemaLoader';

/**
 * For the `monaco-graphql` language worker, these must be specified
 * in a custom webworker. see the readme.
 */
export type GraphQLLanguageConfig = {
  /**
   * Provide a parser that matches `graphql` `parse()` signature
   * Used for internal document parsing operations
   * for autocompletion and hover, `graphql-language-service-parser ` is used via `graphql-language-service-interface`
   */
  parser?: typeof parse;
  /**
   * Custom options passed to `parse`, whether `graphql` parse by default or custom parser
   */
  parseOptions?: ParseOptions;
  /**
   * Take a variety of schema inputs common for the language worker, and transform them
   * to at least a `schema` if not other easily available implementations
   */
  schemaLoader?: SchemaLoader;
  /**
   * An array of schema configurations from which to match files for language features
   */
  schemas?: SchemaConfig[];
  /**
   * External fragments to be used with completion and validation
   */
  exteralFragmentDefinitions?: FragmentDefinitionNode[] | string;
  /**
   * Custom validation rules following `graphql` `ValidationRule` signature
   */
  customValidationRules?: ValidationRule[];
};

type SchemaCacheItem = Omit<SchemaConfig, 'schema'> & { schema: GraphQLSchema };

type SchemaCache = Map<string, SchemaCacheItem>;
const schemaCache: SchemaCache = new Map();

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
    }
    if (parser) {
      this._parser = parser;
      this._cacheSchemas();
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
    const schema = this._schemaLoader(schemaConfig, this.parse);
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
   * @param text
   * @param options
   * @returns {DocumentNode}
   */
  public parse(text: string, options?: ParseOptions): DocumentNode {
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
  ) => {
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
