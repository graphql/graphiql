/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {
  DocumentNode,
  FragmentSpreadNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  TypeDefinitionNode,
  NamedTypeNode,
} from 'graphql';
import type {
  CompletionItem,
  DefinitionQueryResult,
  Diagnostic,
  GraphQLCache,
  GraphQLConfig,
  GraphQLProjectConfig,
  Uri,
} from 'graphql-language-service-types';
import type {Position} from 'graphql-language-service-utils';
import type {Hover} from 'vscode-languageserver-types';

import {Kind, parse, print} from 'graphql';
import {getAutocompleteSuggestions} from './getAutocompleteSuggestions';
import {getHoverInformation} from './getHoverInformation';
import {validateQuery, getRange, SEVERITY} from './getDiagnostics';
import {
  getDefinitionQueryResultForFragmentSpread,
  getDefinitionQueryResultForDefinitionNode,
  getDefinitionQueryResultForNamedType,
} from './getDefinition';
import {getASTNodeAtPosition} from 'graphql-language-service-utils';

const {
  FRAGMENT_DEFINITION,
  OBJECT_TYPE_DEFINITION,
  INTERFACE_TYPE_DEFINITION,
  ENUM_TYPE_DEFINITION,
  UNION_TYPE_DEFINITION,
  SCALAR_TYPE_DEFINITION,
  INPUT_OBJECT_TYPE_DEFINITION,
  SCALAR_TYPE_EXTENSION,
  OBJECT_TYPE_EXTENSION,
  INTERFACE_TYPE_EXTENSION,
  UNION_TYPE_EXTENSION,
  ENUM_TYPE_EXTENSION,
  INPUT_OBJECT_TYPE_EXTENSION,
  DIRECTIVE_DEFINITION,
  FRAGMENT_SPREAD,
  OPERATION_DEFINITION,
  NAMED_TYPE,
} = Kind;

export class GraphQLLanguageService {
  _graphQLCache: GraphQLCache;
  _graphQLConfig: GraphQLConfig;

  constructor(cache: GraphQLCache) {
    this._graphQLCache = cache;
    this._graphQLConfig = cache.getGraphQLConfig();
  }

  async getDiagnostics(
    query: string,
    uri: Uri,
    isRelayCompatMode?: boolean,
  ): Promise<Array<Diagnostic>> {
    // Perform syntax diagnostics first, as this doesn't require
    // schema/fragment definitions, even the project configuration.
    let queryHasExtensions = false;
    const projectConfig = this._graphQLConfig.getConfigForFile(uri);
    const schemaPath = projectConfig.schemaPath;
    try {
      const queryAST = parse(query);
      if (!schemaPath || uri !== schemaPath) {
        queryHasExtensions = queryAST.definitions.some(definition => {
          switch (definition.kind) {
            case OBJECT_TYPE_DEFINITION:
            case INTERFACE_TYPE_DEFINITION:
            case ENUM_TYPE_DEFINITION:
            case UNION_TYPE_DEFINITION:
            case SCALAR_TYPE_DEFINITION:
            case INPUT_OBJECT_TYPE_DEFINITION:
            case SCALAR_TYPE_EXTENSION:
            case OBJECT_TYPE_EXTENSION:
            case INTERFACE_TYPE_EXTENSION:
            case UNION_TYPE_EXTENSION:
            case ENUM_TYPE_EXTENSION:
            case INPUT_OBJECT_TYPE_EXTENSION:
            case DIRECTIVE_DEFINITION:
              return true;
          }
          return false;
        });
      }
    } catch (error) {
      const range = getRange(error.locations[0], query);
      return [
        {
          severity: SEVERITY.ERROR,
          message: error.message,
          source: 'GraphQL: Syntax',
          range,
        },
      ];
    }

    // If there's a matching config, proceed to prepare to run validation
    let source = query;
    const fragmentDefinitions = await this._graphQLCache.getFragmentDefinitions(
      projectConfig,
    );
    const fragmentDependencies = await this._graphQLCache.getFragmentDependencies(
      query,
      fragmentDefinitions,
    );
    const dependenciesSource = fragmentDependencies.reduce(
      (prev, cur) => `${prev} ${print(cur.definition)}`,
      '',
    );

    source = `${source} ${dependenciesSource}`;

    let validationAst = null;
    try {
      validationAst = parse(source);
    } catch (error) {
      // the query string is already checked to be parsed properly - errors
      // from this parse must be from corrupted fragment dependencies.
      // For IDEs we don't care for errors outside of the currently edited
      // query, so we return an empty array here.
      return [];
    }

    // Check if there are custom validation rules to be used
    let customRules;
    const customRulesModulePath =
      projectConfig.extensions.customValidationRules;
    if (customRulesModulePath) {
      /* eslint-disable no-implicit-coercion */
      const rulesPath = require.resolve(`${customRulesModulePath}`);
      if (rulesPath) {
        customRules = require(`${rulesPath}`)(this._graphQLConfig);
      }
      /* eslint-enable no-implicit-coercion */
    }

    const schema = await this._graphQLCache
      .getSchema(projectConfig.projectName, queryHasExtensions)
      .catch(() => null);

    if (!schema) {
      return [];
    }

    return validateQuery(validationAst, schema, customRules, isRelayCompatMode);
  }

  async getAutocompleteSuggestions(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<Array<CompletionItem>> {
    const projectConfig = this._graphQLConfig.getConfigForFile(filePath);
    const schema = await this._graphQLCache
      .getSchema(projectConfig.projectName)
      .catch(() => null);

    if (schema) {
      return getAutocompleteSuggestions(schema, query, position);
    }
    return [];
  }

  async getHoverInformation(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<Hover.contents> {
    const projectConfig = this._graphQLConfig.getConfigForFile(filePath);
    const schema = await this._graphQLCache
      .getSchema(projectConfig.projectName)
      .catch(() => null);

    if (schema) {
      return getHoverInformation(schema, query, position);
    }
    return '';
  }

  async getDefinition(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<?DefinitionQueryResult> {
    const projectConfig = this._graphQLConfig.getConfigForFile(filePath);

    let ast;
    try {
      ast = parse(query);
    } catch (error) {
      return null;
    }

    const node = getASTNodeAtPosition(query, ast, position);
    if (node) {
      switch (node.kind) {
        case FRAGMENT_SPREAD:
          return this._getDefinitionForFragmentSpread(
            query,
            ast,
            node,
            filePath,
            projectConfig,
          );
        case FRAGMENT_DEFINITION:
        case OPERATION_DEFINITION:
          return getDefinitionQueryResultForDefinitionNode(
            filePath,
            query,
            (node: FragmentDefinitionNode | OperationDefinitionNode),
          );
        case NAMED_TYPE:
          return this._getDefinitionForNamedType(
            query,
            ast,
            node,
            filePath,
            projectConfig,
          );
      }
    }
    return null;
  }

  async _getDefinitionForNamedType(
    query: string,
    ast: DocumentNode,
    node: NamedTypeNode,
    filePath: Uri,
    projectConfig: GraphQLProjectConfig,
  ): Promise<?DefinitionQueryResult> {
    const objectTypeDefinitions = await this._graphQLCache.getObjectTypeDefinitions(
      projectConfig,
    );

    const dependencies = await this._graphQLCache.getObjectTypeDependenciesForAST(
      ast,
      objectTypeDefinitions,
    );

    const localObjectTypeDefinitions = ast.definitions.filter(
      definition =>
        definition.kind === OBJECT_TYPE_DEFINITION ||
        definition.kind === INPUT_OBJECT_TYPE_DEFINITION ||
        definition.kind === ENUM_TYPE_DEFINITION,
    );

    const typeCastedDefs = ((localObjectTypeDefinitions: any): Array<
      TypeDefinitionNode,
    >);

    const localOperationDefinationInfos = typeCastedDefs.map(
      (definition: TypeDefinitionNode) => ({
        filePath,
        content: query,
        definition,
      }),
    );

    const result = await getDefinitionQueryResultForNamedType(
      query,
      node,
      dependencies.concat(localOperationDefinationInfos),
    );

    return result;
  }

  async _getDefinitionForFragmentSpread(
    query: string,
    ast: DocumentNode,
    node: FragmentSpreadNode,
    filePath: Uri,
    projectConfig: GraphQLProjectConfig,
  ): Promise<?DefinitionQueryResult> {
    const fragmentDefinitions = await this._graphQLCache.getFragmentDefinitions(
      projectConfig,
    );

    const dependencies = await this._graphQLCache.getFragmentDependenciesForAST(
      ast,
      fragmentDefinitions,
    );

    const localFragDefinitions = ast.definitions.filter(
      definition => definition.kind === FRAGMENT_DEFINITION,
    );

    const typeCastedDefs = ((localFragDefinitions: any): Array<
      FragmentDefinitionNode,
    >);

    const localFragInfos = typeCastedDefs.map(
      (definition: FragmentDefinitionNode) => ({
        filePath,
        content: query,
        definition,
      }),
    );

    const result = await getDefinitionQueryResultForFragmentSpread(
      query,
      node,
      dependencies.concat(localFragInfos),
    );

    return result;
  }
}
