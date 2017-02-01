/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {ASTNode} from 'graphql/language';
import type {GraphQLCache} from '../server/GraphQLCache';
import type {GraphQLRC, GraphQLConfig} from '../config/GraphQLConfig';
import type {
  CompletionItem,
  DefinitionQueryResult,
  Diagnostic,
  Uri,
} from '../types/Types';
import type {Position} from '../utils/Range';

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
import {getASTNodeAtPosition} from '../utils/getASTNodeAtPosition';

export class GraphQLLanguageService {
  _graphQLCache: GraphQLCache;
  _graphQLRC: GraphQLRC;

  constructor(cache: GraphQLCache) {
    this._graphQLCache = cache;
    this._graphQLRC = cache.getGraphQLRC();
  }

  async getDiagnostics(
    query: string,
    uri: Uri,
  ): Promise<Array<Diagnostic>> {
    let source = query;
    const graphQLConfig = this._graphQLRC.getConfigByFilePath(uri);
    // If there's a matching config, proceed to prepare to run validation
    let schema;
    let customRules;
    if (graphQLConfig && graphQLConfig.getSchemaPath()) {
      schema = await this._graphQLCache.getSchema(
        graphQLConfig.getSchemaPath(),
      );
      const fragmentDefinitions =
        await this._graphQLCache.getFragmentDefinitions(graphQLConfig);
      const fragmentDependencies =
        await this._graphQLCache.getFragmentDependencies(
          query,
          fragmentDefinitions,
        );
      const dependenciesSource = fragmentDependencies.reduce(
        (prev, cur) => `${prev} ${print(cur.definition)}`, '',
      );

      source = `${source} ${dependenciesSource}`;

      // Check if there are custom validation rules to be used
      const customRulesModulePath =
        graphQLConfig.getCustomValidationRulesModulePath();
      if (customRulesModulePath) {
        const rulesPath = require.resolve(customRulesModulePath);
        if (rulesPath) {
          customRules = require(rulesPath)(graphQLConfig);
        }
      }
    }

    return getDiagnosticsImpl(source, schema, customRules);
  }

  async getAutocompleteSuggestions(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<Array<CompletionItem>> {
    const graphQLConfig = this._graphQLRC.getConfigByFilePath(filePath);
    let schema;
    if (graphQLConfig && graphQLConfig.getSchemaPath()) {
      schema = await this._graphQLCache.getSchema(
        graphQLConfig.getSchemaPath(),
      );

      return getAutocompleteSuggestions(schema, query, position) || [];
    }
    return [];
  }

  async getDefinition(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<?DefinitionQueryResult> {
    const graphQLConfig = this._graphQLRC.getConfigByFilePath(filePath);
    if (!graphQLConfig) {
      return null;
    }

    let ast;
    try {
      ast = parse(query);
    } catch (error) {
      return null;
    }

    const node = getASTNodeAtPosition(query, ast, position);
    switch (node ? node.kind : null) {
      case FRAGMENT_SPREAD:
        return this._getDefinitionForFragmentSpread(
          query,
          ast,
          node,
          filePath,
          graphQLConfig,
        );
      case FRAGMENT_DEFINITION:
      case OPERATION_DEFINITION:
        return getDefinitionQueryResultForDefinitionNode(
          filePath,
          query,
          node,
        );
      default:
        return null;
    }
  }

  async _getDefinitionForFragmentSpread(
    query: string,
    ast: ASTNode,
    node: ASTNode,
    filePath: Uri,
    graphQLConfig: GraphQLConfig,
  ): Promise<?DefinitionQueryResult> {
    const fragmentDefinitions =
      await this._graphQLCache.getFragmentDefinitions(graphQLConfig);

    const dependencies = await this._graphQLCache.getFragmentDependenciesForAST(
      ast,
      fragmentDefinitions,
    );

    const localFragDefinitions = ast.definitions.filter(
      definition => definition.kind === FRAGMENT_DEFINITION,
    ).map(definition => ({
      file: filePath,
      content: query,
      definition,
    }));

    const result = await getDefinitionQueryResultForFragmentSpread(
      query,
      node,
      dependencies.concat(localFragDefinitions),
    );

    return result;
  }
}
