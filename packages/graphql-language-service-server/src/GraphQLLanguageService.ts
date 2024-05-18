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
  FieldNode,
  GraphQLError,
  Kind,
  parse,
  print,
  isTypeDefinitionNode,
  ArgumentNode,
  typeFromAST,
} from 'graphql';

import {
  CompletionItem,
  Diagnostic,
  Uri,
  IPosition,
  Outline,
  OutlineTree,
  getAutocompleteSuggestions,
  getHoverInformation,
  HoverConfig,
  validateQuery,
  getRange,
  DIAGNOSTIC_SEVERITY,
  getOutline,
  getDefinitionQueryResultForFragmentSpread,
  getDefinitionQueryResultForDefinitionNode,
  getDefinitionQueryResultForNamedType,
  getDefinitionQueryResultForField,
  getASTNodeAtPosition,
  getTokenAtPosition,
  getTypeInfo,
  DefinitionQueryResponse,
  getDefinitionQueryResultForArgument,
} from 'graphql-language-service';

import type { GraphQLCache } from './GraphQLCache';

import { GraphQLConfig, GraphQLProjectConfig } from 'graphql-config';

import type { Logger } from 'vscode-languageserver';
import {
  Hover,
  SymbolInformation,
  SymbolKind,
} from 'vscode-languageserver-types';

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
  _logger: Logger;

  constructor(cache: GraphQLCache, logger: Logger) {
    this._graphQLCache = cache;
    this._graphQLConfig = cache.getGraphQLConfig();

    this._logger = logger;
  }

  getConfigForURI(uri: Uri) {
    const config = this._graphQLCache.getProjectForFile(uri);
    if (config) {
      return config;
    }
  }

  public async getDiagnostics(
    document: string,
    uri: Uri,
    isRelayCompatMode?: boolean,
  ): Promise<Array<Diagnostic>> {
    // Perform syntax diagnostics first, as this doesn't require
    // schema/fragment definitions, even the project configuration.
    let documentHasExtensions = false;
    const projectConfig = this.getConfigForURI(uri);
    // skip validation when there's nothing to validate, prevents noisy unexpected EOF errors
    if (!projectConfig || !document || document.trim().length < 2) {
      return [];
    }
    const { schema: schemaPath, name: projectName, extensions } = projectConfig;

    try {
      const documentAST = parse(document);
      if (!schemaPath || uri !== schemaPath) {
        documentHasExtensions = documentAST.definitions.some(definition => {
          switch (definition.kind) {
            case Kind.OBJECT_TYPE_DEFINITION:
            case Kind.INTERFACE_TYPE_DEFINITION:
            case Kind.ENUM_TYPE_DEFINITION:
            case Kind.UNION_TYPE_DEFINITION:
            case Kind.SCALAR_TYPE_DEFINITION:
            case Kind.INPUT_OBJECT_TYPE_DEFINITION:
            case Kind.SCALAR_TYPE_EXTENSION:
            case Kind.OBJECT_TYPE_EXTENSION:
            case Kind.INTERFACE_TYPE_EXTENSION:
            case Kind.UNION_TYPE_EXTENSION:
            case Kind.ENUM_TYPE_EXTENSION:
            case Kind.INPUT_OBJECT_TYPE_EXTENSION:
            case Kind.DIRECTIVE_DEFINITION:
              return true;
          }

          return false;
        });
      }
    } catch (error) {
      if (error instanceof GraphQLError) {
        const range = getRange(
          error.locations?.[0] ?? { column: 0, line: 0 },
          document,
        );
        return [
          {
            severity: DIAGNOSTIC_SEVERITY.Error,
            message: error.message,
            source: 'GraphQL: Syntax',
            range,
          },
        ];
      }

      throw error;
    }

    // If there's a matching config, proceed to prepare to run validation
    let source = document;
    const fragmentDefinitions = await this._graphQLCache.getFragmentDefinitions(
      projectConfig,
    );

    const fragmentDependencies =
      await this._graphQLCache.getFragmentDependencies(
        document,
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
    } catch {
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
      documentHasExtensions,
    );

    if (!schema) {
      return [];
    }

    return validateQuery(validationAst, schema, customRules, isRelayCompatMode);
  }

  public async getAutocompleteSuggestions(
    query: string,
    position: IPosition,
    filePath: Uri,
  ): Promise<Array<CompletionItem>> {
    const projectConfig = this.getConfigForURI(filePath);
    if (!projectConfig) {
      return [];
    }
    const schema = await this._graphQLCache.getSchema(projectConfig.name);
    if (!schema) {
      return [];
    }
    let fragmentInfo = [] as Array<FragmentDefinitionNode>;
    try {
      const fragmentDefinitions =
        await this._graphQLCache.getFragmentDefinitions(projectConfig);
      fragmentInfo = Array.from(fragmentDefinitions).map(
        ([, info]) => info.definition,
      );
    } catch {}

    return getAutocompleteSuggestions(
      schema,
      query,
      position,
      undefined,
      fragmentInfo,
      {
        uri: filePath,
        fillLeafsOnComplete:
          projectConfig?.extensions?.languageService?.fillLeafsOnComplete ??
          false,
      },
    );
  }

  public async getHoverInformation(
    query: string,
    position: IPosition,
    filePath: Uri,
    options?: HoverConfig,
  ): Promise<Hover['contents']> {
    const projectConfig = this.getConfigForURI(filePath);
    if (!projectConfig) {
      return '';
    }
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
  ): Promise<DefinitionQueryResponse | null> {
    const projectConfig = this.getConfigForURI(filePath);

    if (!projectConfig) {
      return null;
    }

    const schema = await this._graphQLCache.getSchema(projectConfig.name);
    if (!schema) {
      return null;
    }
    let ast;
    try {
      ast = parse(query);
    } catch {
      return null;
    }

    const node = getASTNodeAtPosition(query, ast, position);
    // @ts-expect-error
    const type = node && typeFromAST(schema, node);

    let queryResult: DefinitionQueryResponse | null = null;
    if (node) {
      switch (node.kind) {
        case Kind.FRAGMENT_SPREAD:
          queryResult = await this._getDefinitionForFragmentSpread(
            query,
            ast,
            node,
            filePath,
            projectConfig,
          );
          break;
        case Kind.FRAGMENT_DEFINITION:
        case Kind.OPERATION_DEFINITION:
          queryResult = getDefinitionQueryResultForDefinitionNode(
            filePath,
            query,
            node,
          );
          break;
        case Kind.NAMED_TYPE:
          queryResult = await this._getDefinitionForNamedType(
            query,
            ast,
            node,
            filePath,
            projectConfig,
          );
          break;
        case Kind.FIELD:
          queryResult = await this._getDefinitionForField(
            query,
            ast,
            node,
            filePath,
            projectConfig,
            position,
          );
          break;
        case Kind.ARGUMENT:
          queryResult = await this._getDefinitionForArgument(
            query,
            ast,
            node,
            filePath,
            projectConfig,
            position,
          );
          break;
      }
    }
    if (queryResult) {
      return {
        ...queryResult,
        node,
        type,
      };
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
        name: tree.representativeName ?? 'Anonymous',
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
  ): Promise<DefinitionQueryResponse | null> {
    const objectTypeDefinitions =
      await this._graphQLCache.getObjectTypeDefinitions(projectConfig);

    const dependencies =
      await this._graphQLCache.getObjectTypeDependenciesForAST(
        ast,
        objectTypeDefinitions,
      );

    const localOperationDefinitionInfos = ast.definitions
      .filter(isTypeDefinitionNode)
      .map((definition: TypeDefinitionNode) => ({
        filePath,
        content: query,
        definition,
      }));

    return getDefinitionQueryResultForNamedType(
      query,
      node,
      dependencies.concat(localOperationDefinitionInfos),
    );
  }

  async _getDefinitionForField(
    query: string,
    _ast: DocumentNode,
    _node: FieldNode,
    _filePath: Uri,
    projectConfig: GraphQLProjectConfig,
    position: IPosition,
  ) {
    const token = getTokenAtPosition(query, position);
    const schema = await this._graphQLCache.getSchema(projectConfig.name);

    const typeInfo = getTypeInfo(schema!, token.state);
    const fieldName = typeInfo.fieldDef?.name;

    if (typeInfo && fieldName) {
      const parentTypeName = (typeInfo.parentType as any).toString();

      const objectTypeDefinitions =
        await this._graphQLCache.getObjectTypeDefinitions(projectConfig);

      // TODO: need something like getObjectTypeDependenciesForAST?
      const dependencies = [...objectTypeDefinitions.values()];

      return getDefinitionQueryResultForField(
        fieldName,
        parentTypeName,
        dependencies,
      );
    }

    return null;
  }

  async _getDefinitionForArgument(
    query: string,
    _ast: DocumentNode,
    _node: ArgumentNode,
    _filePath: Uri,
    projectConfig: GraphQLProjectConfig,
    position: IPosition,
  ) {
    const token = getTokenAtPosition(query, position);
    const schema = await this._graphQLCache.getSchema(projectConfig.name);

    const typeInfo = getTypeInfo(schema!, token.state);
    const fieldName = typeInfo.fieldDef?.name;
    const argumentName = typeInfo.argDef?.name;
    if (typeInfo && fieldName && argumentName) {
      const objectTypeDefinitions =
        await this._graphQLCache.getObjectTypeDefinitions(projectConfig);

      // TODO: need something like getObjectTypeDependenciesForAST?
      const dependencies = [...objectTypeDefinitions.values()];

      return getDefinitionQueryResultForArgument(
        argumentName,
        fieldName,
        // @ts-expect-error - typeInfo is not typed correctly
        typeInfo.argDef?.type?.name,
        dependencies,
      );
    }

    return null;
  }

  async _getDefinitionForFragmentSpread(
    query: string,
    ast: DocumentNode,
    node: FragmentSpreadNode,
    filePath: Uri,
    projectConfig: GraphQLProjectConfig,
  ): Promise<DefinitionQueryResponse | null> {
    const fragmentDefinitions = await this._graphQLCache.getFragmentDefinitions(
      projectConfig,
    );

    const dependencies = await this._graphQLCache.getFragmentDependenciesForAST(
      ast,
      fragmentDefinitions,
    );

    const localFragDefinitions = ast.definitions.filter(
      definition => definition.kind === Kind.FRAGMENT_DEFINITION,
    );

    const typeCastedDefs =
      localFragDefinitions as any as Array<FragmentDefinitionNode>;

    const localFragInfos = typeCastedDefs.map(
      (definition: FragmentDefinitionNode) => ({
        filePath,
        content: query,
        definition,
      }),
    );

    return getDefinitionQueryResultForFragmentSpread(
      query,
      node,
      dependencies.concat(localFragInfos),
    );
  }
  async getOutline(documentText: string): Promise<Outline | null> {
    return getOutline(documentText);
  }
}
