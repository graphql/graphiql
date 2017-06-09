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
} from 'graphql';
import type {
  CompletionItem,
  DefinitionQueryResult,
  Diagnostic,
  GraphQLCache,
  GraphQLConfig,
  Uri,
} from 'graphql-language-service-types';
import type {Position} from 'graphql-language-service-utils';

import {
  FRAGMENT_SPREAD,
  FRAGMENT_DEFINITION,
  OPERATION_DEFINITION,
} from 'graphql/language/kinds';

import {parse, print} from 'graphql';
import {getAutocompleteSuggestions} from './getAutocompleteSuggestions';
import {getDiagnostics as getDiagnosticsImpl} from './getDiagnostics';
import {
  getDefinitionQueryResultForFragmentSpread,
  getDefinitionQueryResultForDefinitionNode,
} from './getDefinition';
import {getASTNodeAtPosition} from 'graphql-language-service-utils';

export class GraphQLLanguageService {
  _graphQLCache: GraphQLCache;
  _graphQLConfig: GraphQLConfig;

  constructor(cache: GraphQLCache) {
    this._graphQLCache = cache;
    this._graphQLConfig = cache.getGraphQLConfig();
  }

  async getDiagnostics(query: string, uri: Uri): Promise<Array<Diagnostic>> {
    let source = query;
    const appName = this._graphQLConfig.getAppConfigNameByFilePath(uri);
    // If there's a matching config, proceed to prepare to run validation
    let schema;
    let customRules;
    if (this._graphQLConfig.getSchemaPath(appName)) {
      schema = await this._graphQLCache.getSchema(
        this._graphQLConfig.getSchemaPath(appName),
      );
      const fragmentDefinitions = await this._graphQLCache.getFragmentDefinitions(
        this._graphQLConfig,
        appName,
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

      // Check if there are custom validation rules to be used
      const customRulesModulePath = this._graphQLConfig.getCustomValidationRulesModulePath(
        appName,
      );
      if (customRulesModulePath) {
        /* eslint-disable no-implicit-coercion */
        const rulesPath = require.resolve('' + customRulesModulePath);
        if (rulesPath) {
          customRules = require('' + rulesPath)(this._graphQLConfig);
        }
        /* eslint-enable no-implicit-coercion */
      }
    }

    return getDiagnosticsImpl(source, schema, customRules);
  }

  async getAutocompleteSuggestions(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<Array<CompletionItem>> {
    const appName = this._graphQLConfig.getAppConfigNameByFilePath(filePath);
    let schema;
    if (this._graphQLConfig.getSchemaPath(appName)) {
      schema = await this._graphQLCache.getSchema(
        this._graphQLConfig.getSchemaPath(appName),
      );

      if (schema) {
        return getAutocompleteSuggestions(schema, query, position);
      }
    }
    return [];
  }

  async getDefinition(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<?DefinitionQueryResult> {
    const appName = this._graphQLConfig.getAppConfigNameByFilePath(filePath);

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
            this._graphQLConfig,
            appName,
          );
        case FRAGMENT_DEFINITION:
        case OPERATION_DEFINITION:
          return getDefinitionQueryResultForDefinitionNode(
            filePath,
            query,
            (node: FragmentDefinitionNode | OperationDefinitionNode),
          );
      }
    }
    return null;
  }

  async _getDefinitionForFragmentSpread(
    query: string,
    ast: DocumentNode,
    node: FragmentSpreadNode,
    filePath: Uri,
    graphQLConfig: GraphQLConfig,
    appName: ?string,
  ): Promise<?DefinitionQueryResult> {
    const fragmentDefinitions = await this._graphQLCache.getFragmentDefinitions(
      graphQLConfig,
      appName,
    );

    const dependencies = await this._graphQLCache.getFragmentDependenciesForAST(
      ast,
      fragmentDefinitions,
    );

    const localFragDefinitions = ast.definitions.filter(
      definition => definition.kind === FRAGMENT_DEFINITION,
    );

    const typeCastedDefs = ((localFragDefinitions: any): Array<FragmentDefinitionNode>);

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
