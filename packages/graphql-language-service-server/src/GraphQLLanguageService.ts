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
  visit,
} from 'graphql';

import {
  CompletionItem,
  Diagnostic,
  Uri,
  IPosition,
  Outline,
  OutlineTree,
  GraphQLCache,
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
  DefinitionQueryResult,
  getASTNodeAtPosition,
  getTokenAtPosition,
  getTypeInfo,
  Reference,
  Range,
  Position,
} from 'graphql-language-service';

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
        {
          uri: filePath,
          fillLeafsOnComplete:
            projectConfig?.extensions?.languageService?.fillLeafsOnComplete ??
            false,
        },
      );
    }
    return [];
  }

  public async getHoverInformation(
    document: string,
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
      return getHoverInformation(
        schema,
        document,
        position,
        undefined,
        options,
      );
    }
    return '';
  }

  public async getDefinition(
    document: string,
    position: IPosition,
    filePath: Uri,
  ): Promise<DefinitionQueryResult | null> {
    const projectConfig = this.getConfigForURI(filePath);
    if (!projectConfig) {
      return null;
    }

    let ast;
    try {
      ast = parse(document);
    } catch {
      return null;
    }

    const node = getASTNodeAtPosition(document, ast, position);
    if (node) {
      switch (node.kind) {
        case Kind.FRAGMENT_SPREAD:
          return this._getDefinitionForFragmentSpread(
            document,
            ast,
            node,
            filePath,
            projectConfig,
          );

        case Kind.FRAGMENT_DEFINITION:
        case Kind.OPERATION_DEFINITION:
          return getDefinitionQueryResultForDefinitionNode(
            filePath,
            document,
            node,
          );

        case Kind.NAMED_TYPE:
          return this._getDefinitionForNamedType(
            document,
            ast,
            node,
            filePath,
            projectConfig,
          );

        case Kind.FIELD:
          return this._getDefinitionForField(
            document,
            ast,
            node,
            filePath,
            projectConfig,
            position,
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
        // @ts-expect-error
        name: tree.representativeName,
        kind: getKind(tree),
        location: {
          uri: filePath,
          range: {
            start: tree.startPosition,
            // @ts-expect-error
            end: tree.endPosition,
          },
        },
        containerName: parent ? parent.representativeName : undefined,
      });
      input.push(...tree.children.map(child => [tree, child]));
    }
    return output;
  }
  // TODO: move this logic to graphql-language-service for monaco-graphql/etc eventually
  public async getReferences(
    document: string,
    position: IPosition,
    filePath: Uri,
  ): Promise<Reference[] | []> {
    const projectConfig = this.getConfigForURI(filePath);
    if (!projectConfig) {
      return [];
    }

    let ast;
    try {
      ast = parse(document);
    } catch {
      return [];
    }

    const definitionNode = getASTNodeAtPosition(document, ast, position);

    // @ts-expect-error
    const name = definitionNode?.name?.value;

    if (!name) {
      return [];
    }

    const schema = await projectConfig.getSchema('DocumentNode');
    if (!schema) {
      return [];
    }

    const references: Reference[] = [];

    const matchNodeByName = (node: NamedTypeNode | FragmentSpreadNode) => {
      if (!node.loc?.source) {
        return;
      }
      if (node.name.value.toLowerCase() === name.toLowerCase()) {
        references.push({
          location: {
            uri: node.loc.source.name,
            range: new Range(
              new Position(
                node.loc.startToken.line - 1,
                node.loc.startToken.column - 1,
              ),
              new Position(
                node.loc.endToken.line - 1,
                node.loc.endToken.column - 1,
              ),
            ),
          },
        });
      }
    };
    // TODO: check fragment and type definition caches
    // instead of this workaround that only works for a single
    // file and schema
    // the proper solution requires searching all documents in the cache
    visit(parse(document), {
      FragmentSpread(node) {
        matchNodeByName(node);
      },
      NamedType(node) {
        matchNodeByName(node);
      },
    });

    visit(schema, {
      FragmentSpread(node) {
        matchNodeByName(node);
      },
      NamedType(node) {
        matchNodeByName(node);
      },
    });

    return references;
  }

  async _getDefinitionForNamedType(
    document: string,
    ast: DocumentNode,
    node: NamedTypeNode,
    filePath: Uri,
    projectConfig: GraphQLProjectConfig,
  ): Promise<DefinitionQueryResult | null> {
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
        content: document,
        definition,
      }));

    const result = await getDefinitionQueryResultForNamedType(
      document,
      node,
      dependencies.concat(localOperationDefinitionInfos),
    );

    return result;
  }

  async _getDefinitionForField(
    document: string,
    _ast: DocumentNode,
    _node: FieldNode,
    _filePath: Uri,
    projectConfig: GraphQLProjectConfig,
    position: IPosition,
  ) {
    const token = getTokenAtPosition(document, position);
    const schema = await this._graphQLCache.getSchema(projectConfig.name);

    const typeInfo = getTypeInfo(schema!, token.state);
    const fieldName = typeInfo.fieldDef?.name;

    if (typeInfo && fieldName) {
      const parentTypeName = (typeInfo.parentType as any).toString();

      const objectTypeDefinitions =
        await this._graphQLCache.getObjectTypeDefinitions(projectConfig);

      // TODO: need something like getObjectTypeDependenciesForAST?
      const dependencies = [...objectTypeDefinitions.values()];

      const result = await getDefinitionQueryResultForField(
        fieldName,
        parentTypeName,
        dependencies,
      );

      return result;
    }

    return null;
  }

  async _getDefinitionForFragmentSpread(
    document: string,
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
      definition => definition.kind === Kind.FRAGMENT_DEFINITION,
    );

    const typeCastedDefs =
      localFragDefinitions as any as Array<FragmentDefinitionNode>;

    const localFragInfos = typeCastedDefs.map(
      (definition: FragmentDefinitionNode) => ({
        filePath,
        content: document,
        definition,
      }),
    );

    const result = await getDefinitionQueryResultForFragmentSpread(
      document,
      node,
      dependencies.concat(localFragInfos),
    );

    return result;
  }
  async getOutline(document: string): Promise<Outline | null> {
    return getOutline(document);
  }
}
