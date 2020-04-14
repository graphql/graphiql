/**
 *  Copyright (c) 2019 GraphQL Contributors
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
  GraphQLSchema,
} from 'graphql';

import {
  CompletionItem,
  DefinitionQueryResult,
  Diagnostic,
  Uri,
  Position,
  Outline,
  OutlineTree,
} from 'graphql-language-service-types';

import { ContextToken } from 'graphql-language-service-parser'

import { GraphQLCache } from './GraphQLCache';

import { GraphQLConfig, GraphQLProjectConfig } from 'graphql-config';
import {
  Hover,
  SymbolInformation,
  SymbolKind,
} from 'vscode-languageserver-types';

import { Kind, parse, print } from 'graphql';
import { getAutocompleteSuggestions } from './getAutocompleteSuggestions';
import { getHoverInformation } from './getHoverInformation';
import { validateQuery, getRange, DIAGNOSTIC_SEVERITY } from './getDiagnostics';
import {
  getDefinitionQueryResultForFragmentSpread,
  getDefinitionQueryResultForDefinitionNode,
  getDefinitionQueryResultForNamedType,
} from './getDefinition';

import { getOutline } from './getOutline';

import { getASTNodeAtPosition } from 'graphql-language-service-utils';

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
  _project: GraphQLProjectConfig;

  constructor(cache: GraphQLCache) {
    this._graphQLCache = cache;
    this._graphQLConfig = cache.getGraphQLConfig();
    this._project = this._graphQLConfig.getDefault();
  }

  getConfigForURI(uri: Uri) {
    const config = this._graphQLConfig.getProjectForFile(uri);
    if (config) {
      return config;
    }
    throw Error(`No config found for uri: ${uri}`);
  }
  public async getSchema(
    projectName?: string,
    queryHasExtensions?: boolean,
  ): Promise<GraphQLSchema | null> {
    try {
      const schema = projectName
        ? await this._graphQLCache.getSchema(projectName, queryHasExtensions)
        : await this._graphQLConfig.getDefault().getSchema();
      return schema;
    } catch (err) {
      console.warn('no schema found');
      return null;
    }
  }
  public async getProject(projectName: string) {
    this._project = this._graphQLConfig.getProject(projectName);
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
      (prev: any, cur: any) => `${prev} ${print(cur.definition)}`,
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
    const customValidationRules = extensions.customValidationRules;
    if (customValidationRules) {
      customRules = customValidationRules(this._graphQLConfig);

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
    position: Position,
    filePath: Uri,
    contextToken?: ContextToken,
  ): Promise<Array<CompletionItem>> {
    const projectConfig = this.getConfigForURI(filePath);
<<<<<<< HEAD
    const schema = await this._graphQLCache.getSchema(projectConfig.name);
=======
    const schema = await this.getSchema(projectConfig.name);
>>>>>>> improvement: changes to LSP to prepare for monaco

    if (schema) {
      return getAutocompleteSuggestions(schema, query, position, contextToken);
    }
    return [];
  }

  public async getHoverInformation(
    query: string,
    position: Position,
    filePath: Uri,
  ): Promise<Hover['contents']> {
    const projectConfig = this.getConfigForURI(filePath);
<<<<<<< HEAD
    const schema = await this._graphQLCache.getSchema(projectConfig.name);
=======
    const schema = await this.getSchema(projectConfig.name);
>>>>>>> improvement: changes to LSP to prepare for monaco

    if (schema) {
      return getHoverInformation(schema, query, position);
    }
    return '';
  }

  public async getDefinition(
    query: string,
    position: Position,
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
        name: tree.representativeName as string,
        kind: getKind(tree),
        location: {
          uri: filePath,
          range: {
            start: tree.startPosition,
            end: tree.endPosition as Position,
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
