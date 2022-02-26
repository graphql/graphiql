/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  DocumentNode,
  FragmentSpreadNode,
  FragmentDefinitionNode,
  TypeDefinitionNode,
  NamedTypeNode,
  ValidationRule,
} from 'graphql';

import {
  CompletionItem,
  Diagnostic,
  Uri,
  IPosition,
  Outline,
  OutlineTree,
  GraphQLCache,
} from 'graphql-language-service';

import { GraphQLConfig, GraphQLProjectConfig } from 'graphql-config';

import {
  Hover,
  SymbolInformation,
  SymbolKind,
} from 'vscode-languageserver-types';

import { Kind, parse, print } from 'graphql';
import { getAutocompleteSuggestions } from 'graphql-language-service/src/interface/getAutocompleteSuggestions';
import {
  getHoverInformation,
  HoverConfig,
} from 'graphql-language-service/src/interface/getHoverInformation';
import {
  validateQuery,
  getRange,
  DIAGNOSTIC_SEVERITY,
} from 'graphql-language-service/src/interface/getDiagnostics';
import {
  getDefinitionQueryResultForFragmentSpread,
  getDefinitionQueryResultForDefinitionNode,
  getDefinitionQueryResultForNamedType,
  DefinitionQueryResult,
} from 'graphql-language-service/src/interface/getDefinition';

import { getOutline } from 'graphql-language-service/src/interface/getOutline';

import { getASTNodeAtPosition } from 'graphql-language-service/src/utils';

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

const KIND_TO_SYMBOL_KIND: { [key: string]: SymbolKind } = {
  [Kind.FIELD]: SymbolKind.Field,
  [Kind.OPERATION_DEFINITION]: SymbolKind.Class,
  [Kind.FRAGMENT_DEFINITION]: SymbolKind.Class,
  [Kind.FRAGMENT_SPREAD]: SymbolKind.Struct,
  [Kind.OBJECT_TYPE_DEFINITION]: SymbolKind.Class,
  [Kind.ENUM_TYPE_DEFINITION]: SymbolKind.Enum,
  [Kind.ENUM_VALUE_DEFINITION]: SymbolKind.EnumMember,
  [Kind.INPUT_OBJECT_TYPE_DEFINITION]: SymbolKind.Class,
  [Kind.INPUT_VALUE_DEFINITION]: SymbolKind.Field,
  [Kind.FIELD_DEFINITION]: SymbolKind.Field,
  [Kind.INTERFACE_TYPE_DEFINITION]: SymbolKind.Interface,
  [Kind.DOCUMENT]: SymbolKind.File,
  // novel, for symbols only
  FieldWithArguments: SymbolKind.Method,
};

function getKind(tree: OutlineTree) {
  if (
    tree.kind === 'FieldDefinition' &&
    tree.children &&
    tree.children.length > 0
  ) {
    return KIND_TO_SYMBOL_KIND.FieldWithArguments;
  }
  return KIND_TO_SYMBOL_KIND[tree.kind];
}

export class GraphQLLanguageService {
  _graphQLCache: GraphQLCache;
  _graphQLConfig: GraphQLConfig;

  constructor(cache: GraphQLCache) {
    this._graphQLCache = cache;
    this._graphQLConfig = cache.getGraphQLConfig();
  }

  getConfigForURI(uri: Uri) {
    const config = this._graphQLCache.getProjectForFile(uri);
    if (config) {
      return config;
    }
    throw Error(`No config found for uri: ${uri}`);
  }

  public async getDiagnostics(
    query: string,
    uri: Uri,
    isRelayCompatMode?: boolean,
  ): Promise<Array<Diagnostic>> {
    // Perform syntax diagnostics first, as this doesn't require
    // schema/fragment definitions, even the project configuration.
    let queryHasExtensions = false;
    const projectConfig = this.getConfigForURI(uri);
    if (!projectConfig) {
      return [];
    }
    const { schema: schemaPath, name: projectName, extensions } = projectConfig;

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
          severity: DIAGNOSTIC_SEVERITY.Error,
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
    let customRules: ValidationRule[] | null = null;
    if (
      extensions?.customValidationRules &&
      typeof extensions.customValidationRules === 'function'
    ) {
      customRules = extensions.customValidationRules(this._graphQLConfig);

      /* eslint-enable no-implicit-coercion */
    }
    const schema = await this._graphQLCache.getSchema(
      projectName,
      queryHasExtensions,
    );

    if (!schema) {
      return [];
    }

    return validateQuery(
      validationAst,
      schema,
      customRules as ValidationRule[],
      isRelayCompatMode,
    );
  }

  public async getAutocompleteSuggestions(
    query: string,
    position: IPosition,
    filePath: Uri,
  ): Promise<Array<CompletionItem>> {
    const projectConfig = this.getConfigForURI(filePath);
    const schema = await this._graphQLCache.getSchema(projectConfig.name);
    const fragmentDefinitions = await this._graphQLCache.getFragmentDefinitions(
      projectConfig,
    );

    const fragmentInfo = Array.from(fragmentDefinitions).map(
      ([, info]) => info.definition,
    );

    if (schema) {
      return getAutocompleteSuggestions(
        schema,
        query,
        position,
        undefined,
        fragmentInfo,
      );
    }
    return [];
  }

  public async getHoverInformation(
    query: string,
    position: IPosition,
    filePath: Uri,
    options?: HoverConfig,
  ): Promise<Hover['contents']> {
    const projectConfig = this.getConfigForURI(filePath);
    const schema = await this._graphQLCache.getSchema(projectConfig.name);

    if (schema) {
      return getHoverInformation(schema, query, position, undefined, options);
    }
    return '';
  }

  public async getDefinition(
    query: string,
    position: IPosition,
    filePath: Uri,
  ): Promise<DefinitionQueryResult | null> {
    const projectConfig = this.getConfigForURI(filePath);

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
            node,
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

  public async getDocumentSymbols(
    document: string,
    filePath: Uri,
  ): Promise<SymbolInformation[]> {
    const outline = await this.getOutline(document);
    if (!outline) {
      return [];
    }

    const output: Array<SymbolInformation> = [];
    const input = outline.outlineTrees.map((tree: OutlineTree) => [null, tree]);

    while (input.length > 0) {
      const res = input.pop();
      if (!res) {
        return [];
      }
      const [parent, tree] = res;
      if (!tree) {
        return [];
      }

      output.push({
        // @ts-ignore
        name: tree.representativeName,
        kind: getKind(tree),
        location: {
          uri: filePath,
          range: {
            start: tree.startPosition,
            // @ts-ignore
            end: tree.endPosition,
          },
        },
        containerName: parent ? parent.representativeName : undefined,
      });
      input.push(...tree.children.map(child => [tree, child]));
    }
    return output;
  }
  //
  // public async getReferences(
  //   document: string,
  //   position: Position,
  //   filePath: Uri,
  // ): Promise<Location[]> {
  //
  // }

  async _getDefinitionForNamedType(
    query: string,
    ast: DocumentNode,
    node: NamedTypeNode,
    filePath: Uri,
    projectConfig: GraphQLProjectConfig,
  ): Promise<DefinitionQueryResult | null> {
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
        definition.kind === ENUM_TYPE_DEFINITION ||
        definition.kind === SCALAR_TYPE_DEFINITION ||
        definition.kind === INTERFACE_TYPE_DEFINITION,
    );

    const typeCastedDefs = (localObjectTypeDefinitions as any) as Array<
      TypeDefinitionNode
    >;

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
  ): Promise<DefinitionQueryResult | null> {
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

    const typeCastedDefs = (localFragDefinitions as any) as Array<
      FragmentDefinitionNode
    >;

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
  async getOutline(documentText: string): Promise<Outline | null> {
    return getOutline(documentText);
  }
}
