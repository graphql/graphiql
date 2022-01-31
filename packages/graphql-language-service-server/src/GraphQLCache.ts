/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { ASTNode, DocumentNode, DefinitionNode } from 'graphql/language';
import type {
  CachedContent,
  GraphQLCache as GraphQLCacheInterface,
  GraphQLFileMetadata,
  GraphQLFileInfo,
  FragmentInfo,
  ObjectTypeInfo,
  Uri,
} from 'graphql-language-service';

import * as fs from 'fs';
import { GraphQLSchema, Kind, extendSchema, parse, visit } from 'graphql';
import nullthrows from 'nullthrows';

import {
  loadConfig,
  GraphQLConfig,
  GraphQLProjectConfig,
} from 'graphql-config';
import { parseDocument } from './parseDocument';
import stringToHash from './stringToHash';
import glob from 'glob';
import { LoadConfigOptions } from './types';
import { URI } from 'vscode-uri';

// Maximum files to read when processing GraphQL files.
const MAX_READS = 200;

const {
  DOCUMENT,
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
} = Kind;

export async function getGraphQLCache({
  parser,
  loadConfigOptions,
  config,
}: {
  parser: typeof parseDocument;
  loadConfigOptions: LoadConfigOptions;
  config?: GraphQLConfig;
}): Promise<GraphQLCache> {
  let graphQLConfig = config;
  if (!graphQLConfig) {
    graphQLConfig = await loadConfig(loadConfigOptions);
  }
  return new GraphQLCache({
    configDir: loadConfigOptions.rootDir as string,
    config: graphQLConfig as GraphQLConfig,
    parser,
  });
}

export class GraphQLCache implements GraphQLCacheInterface {
  _configDir: Uri;
  _graphQLFileListCache: Map<Uri, Map<string, GraphQLFileInfo>>;
  _graphQLConfig: GraphQLConfig;
  _schemaMap: Map<Uri, GraphQLSchema>;
  _typeExtensionMap: Map<Uri, number>;
  _fragmentDefinitionsCache: Map<Uri, Map<string, FragmentInfo>>;
  _typeDefinitionsCache: Map<Uri, Map<string, ObjectTypeInfo>>;
  _parser: typeof parseDocument;

  constructor({
    configDir,
    config,
    parser,
  }: {
    configDir: Uri;
    config: GraphQLConfig;
    parser: typeof parseDocument;
  }) {
    this._configDir = configDir;
    this._graphQLConfig = config;
    this._graphQLFileListCache = new Map();
    this._schemaMap = new Map();
    this._fragmentDefinitionsCache = new Map();
    this._typeDefinitionsCache = new Map();
    this._typeExtensionMap = new Map();
    this._parser = parser;
  }

  getGraphQLConfig = (): GraphQLConfig => this._graphQLConfig;

  getProjectForFile = (uri: string): GraphQLProjectConfig => {
    return this._graphQLConfig.getProjectForFile(URI.parse(uri).fsPath);
  };

  getFragmentDependencies = async (
    query: string,
    fragmentDefinitions?: Map<string, FragmentInfo> | null,
  ): Promise<FragmentInfo[]> => {
    // If there isn't context for fragment references,
    // return an empty array.
    if (!fragmentDefinitions) {
      return [];
    }
    // If the query cannot be parsed, validations cannot happen yet.
    // Return an empty array.
    let parsedQuery;
    try {
      parsedQuery = parse(query);
    } catch (error) {
      return [];
    }
    return this.getFragmentDependenciesForAST(parsedQuery, fragmentDefinitions);
  };

  getFragmentDependenciesForAST = async (
    parsedQuery: ASTNode,
    fragmentDefinitions: Map<string, FragmentInfo>,
  ): Promise<FragmentInfo[]> => {
    if (!fragmentDefinitions) {
      return [];
    }

    const existingFrags = new Map();
    const referencedFragNames = new Set<string>();

    visit(parsedQuery, {
      FragmentDefinition(node) {
        existingFrags.set(node.name.value, true);
      },
      FragmentSpread(node) {
        if (!referencedFragNames.has(node.name.value)) {
          referencedFragNames.add(node.name.value);
        }
      },
    });

    const asts = new Set<FragmentInfo>();
    referencedFragNames.forEach(name => {
      if (!existingFrags.has(name) && fragmentDefinitions.has(name)) {
        asts.add(nullthrows(fragmentDefinitions.get(name)));
      }
    });

    const referencedFragments: FragmentInfo[] = [];

    asts.forEach(ast => {
      visit(ast.definition, {
        FragmentSpread(node) {
          if (
            !referencedFragNames.has(node.name.value) &&
            fragmentDefinitions.get(node.name.value)
          ) {
            asts.add(nullthrows(fragmentDefinitions.get(node.name.value)));
            referencedFragNames.add(node.name.value);
          }
        },
      });
      if (!existingFrags.has(ast.definition.name.value)) {
        referencedFragments.push(ast);
      }
    });

    return referencedFragments;
  };

  getFragmentDefinitions = async (
    projectConfig: GraphQLProjectConfig,
  ): Promise<Map<string, FragmentInfo>> => {
    // This function may be called from other classes.
    // If then, check the cache first.
    const rootDir = projectConfig.dirpath;
    if (this._fragmentDefinitionsCache.has(rootDir)) {
      return this._fragmentDefinitionsCache.get(rootDir) || new Map();
    }

    const list = await this._readFilesFromInputDirs(rootDir, projectConfig);

    const {
      fragmentDefinitions,
      graphQLFileMap,
    } = await this.readAllGraphQLFiles(list);

    this._fragmentDefinitionsCache.set(rootDir, fragmentDefinitions);
    this._graphQLFileListCache.set(rootDir, graphQLFileMap);

    return fragmentDefinitions;
  };

  getObjectTypeDependencies = async (
    query: string,
    objectTypeDefinitions?: Map<string, ObjectTypeInfo>,
  ): Promise<Array<ObjectTypeInfo>> => {
    // If there isn't context for object type references,
    // return an empty array.
    if (!objectTypeDefinitions) {
      return [];
    }
    // If the query cannot be parsed, validations cannot happen yet.
    // Return an empty array.
    let parsedQuery;
    try {
      parsedQuery = parse(query);
    } catch (error) {
      return [];
    }
    return this.getObjectTypeDependenciesForAST(
      parsedQuery,
      objectTypeDefinitions,
    );
  };

  getObjectTypeDependenciesForAST = async (
    parsedQuery: ASTNode,
    objectTypeDefinitions: Map<string, ObjectTypeInfo>,
  ): Promise<Array<ObjectTypeInfo>> => {
    if (!objectTypeDefinitions) {
      return [];
    }

    const existingObjectTypes = new Map();
    const referencedObjectTypes = new Set<string>();

    visit(parsedQuery, {
      ObjectTypeDefinition(node) {
        existingObjectTypes.set(node.name.value, true);
      },
      InputObjectTypeDefinition(node) {
        existingObjectTypes.set(node.name.value, true);
      },
      EnumTypeDefinition(node) {
        existingObjectTypes.set(node.name.value, true);
      },
      NamedType(node) {
        if (!referencedObjectTypes.has(node.name.value)) {
          referencedObjectTypes.add(node.name.value);
        }
      },
    });

    const asts = new Set<ObjectTypeInfo>();
    referencedObjectTypes.forEach(name => {
      if (!existingObjectTypes.has(name) && objectTypeDefinitions.has(name)) {
        asts.add(nullthrows(objectTypeDefinitions.get(name)));
      }
    });

    const referencedObjects: ObjectTypeInfo[] = [];

    asts.forEach(ast => {
      visit(ast.definition, {
        NamedType(node) {
          if (
            !referencedObjectTypes.has(node.name.value) &&
            objectTypeDefinitions.get(node.name.value)
          ) {
            asts.add(nullthrows(objectTypeDefinitions.get(node.name.value)));
            referencedObjectTypes.add(node.name.value);
          }
        },
      });
      if (!existingObjectTypes.has(ast.definition.name.value)) {
        referencedObjects.push(ast);
      }
    });

    return referencedObjects;
  };

  getObjectTypeDefinitions = async (
    projectConfig: GraphQLProjectConfig,
  ): Promise<Map<string, ObjectTypeInfo>> => {
    // This function may be called from other classes.
    // If then, check the cache first.
    const rootDir = projectConfig.dirpath;
    if (this._typeDefinitionsCache.has(rootDir)) {
      return this._typeDefinitionsCache.get(rootDir) || new Map();
    }
    const list = await this._readFilesFromInputDirs(rootDir, projectConfig);
    const {
      objectTypeDefinitions,
      graphQLFileMap,
    } = await this.readAllGraphQLFiles(list);
    this._typeDefinitionsCache.set(rootDir, objectTypeDefinitions);
    this._graphQLFileListCache.set(rootDir, graphQLFileMap);

    return objectTypeDefinitions;
  };

  _readFilesFromInputDirs = (
    rootDir: string,
    projectConfig: GraphQLProjectConfig,
  ): Promise<Array<GraphQLFileMetadata>> => {
    let pattern: string;
    const { documents } = projectConfig;

    if (!documents || documents.length === 0) {
      return Promise.resolve([]);
    }

    // See https://github.com/graphql/graphql-language-service/issues/221
    // for details on why special handling is required here for the
    // documents.length === 1 case.
    if (typeof documents === 'string') {
      pattern = documents;
    } else if (documents.length === 1) {
      // @ts-ignore
      pattern = documents[0];
    } else {
      pattern = `{${documents.join(',')}}`;
    }

    return new Promise((resolve, reject) => {
      const globResult = new glob.Glob(
        pattern,
        {
          cwd: rootDir,
          stat: true,
          absolute: false,
          ignore: [
            'generated/relay',
            '**/__flow__/**',
            '**/__generated__/**',
            '**/__github__/**',
            '**/__mocks__/**',
            '**/node_modules/**',
            '**/__flowtests__/**',
          ],
        },
        error => {
          if (error) {
            reject(error);
          }
        },
      );
      globResult.on('end', () => {
        resolve(
          Object.keys(globResult.statCache)
            .filter(
              filePath => typeof globResult.statCache[filePath] === 'object',
            )
            .filter(filePath => projectConfig.match(filePath))
            .map(filePath => {
              // @TODO
              // so we have to force this here
              // because glob's DefinitelyTyped doesn't use fs.Stats here though
              // the docs indicate that is what's there :shrug:
              const cacheEntry = globResult.statCache[filePath] as fs.Stats;
              return {
                filePath: URI.parse(filePath).toString(),
                mtime: Math.trunc(cacheEntry.mtime.getTime() / 1000),
                size: cacheEntry.size,
              };
            }),
        );
      });
    });
  };

  async _updateGraphQLFileListCache(
    graphQLFileMap: Map<Uri, GraphQLFileInfo>,
    metrics: { size: number; mtime: number },
    filePath: Uri,
    exists: boolean,
  ): Promise<Map<Uri, GraphQLFileInfo>> {
    const fileAndContent = exists
      ? await this.promiseToReadGraphQLFile(filePath)
      : null;

    const existingFile = graphQLFileMap.get(filePath);

    // 3 cases for the cache invalidation: create/modify/delete.
    // For create/modify, swap the existing entry if available;
    // otherwise, just push in the new entry created.
    // For delete, check `exists` and splice the file out.
    if (existingFile && !exists) {
      graphQLFileMap.delete(filePath);
    } else if (fileAndContent) {
      const graphQLFileInfo = { ...fileAndContent, ...metrics };
      graphQLFileMap.set(filePath, graphQLFileInfo);
    }

    return graphQLFileMap;
  }

  async updateFragmentDefinition(
    rootDir: Uri,
    filePath: Uri,
    contents: Array<CachedContent>,
  ): Promise<void> {
    const cache = this._fragmentDefinitionsCache.get(rootDir);
    const asts = contents.map(({ query }) => {
      try {
        return {
          ast: parse(query),
          query,
        };
      } catch (error) {
        return { ast: null, query };
      }
    });
    if (cache) {
      // first go through the fragment list to delete the ones from this file
      cache.forEach((value, key) => {
        if (value.filePath === filePath) {
          cache.delete(key);
        }
      });
      asts.forEach(({ ast, query }) => {
        if (!ast) {
          return;
        }
        ast.definitions.forEach(definition => {
          if (definition.kind === FRAGMENT_DEFINITION) {
            cache.set(definition.name.value, {
              filePath,
              content: query,
              definition,
            });
          }
        });
      });
    }
  }

  async updateFragmentDefinitionCache(
    rootDir: Uri,
    filePath: Uri,
    exists: boolean,
  ): Promise<void> {
    const fileAndContent = exists
      ? await this.promiseToReadGraphQLFile(filePath)
      : null;
    // In the case of fragment definitions, the cache could just map the
    // definition name to the parsed ast, whether or not it existed
    // previously.
    // For delete, remove the entry from the set.
    if (!exists) {
      const cache = this._fragmentDefinitionsCache.get(rootDir);
      if (cache) {
        cache.delete(filePath);
      }
    } else if (fileAndContent && fileAndContent.queries) {
      this.updateFragmentDefinition(rootDir, filePath, fileAndContent.queries);
    }
  }

  async updateObjectTypeDefinition(
    rootDir: Uri,
    filePath: Uri,
    contents: Array<CachedContent>,
  ): Promise<void> {
    const cache = this._typeDefinitionsCache.get(rootDir);
    const asts = contents.map(({ query }) => {
      try {
        return {
          ast: parse(query),
          query,
        };
      } catch (error) {
        return { ast: null, query };
      }
    });
    if (cache) {
      // first go through the types list to delete the ones from this file
      cache.forEach((value, key) => {
        if (value.filePath === filePath) {
          cache.delete(key);
        }
      });
      asts.forEach(({ ast, query }) => {
        if (!ast) {
          return;
        }
        ast.definitions.forEach(definition => {
          if (
            definition.kind === OBJECT_TYPE_DEFINITION ||
            definition.kind === INPUT_OBJECT_TYPE_DEFINITION ||
            definition.kind === ENUM_TYPE_DEFINITION
          ) {
            cache.set(definition.name.value, {
              filePath,
              content: query,
              definition,
            });
          }
        });
      });
    }
  }

  async updateObjectTypeDefinitionCache(
    rootDir: Uri,
    filePath: Uri,
    exists: boolean,
  ): Promise<void> {
    const fileAndContent = exists
      ? await this.promiseToReadGraphQLFile(filePath)
      : null;
    // In the case of type definitions, the cache could just map the
    // definition name to the parsed ast, whether or not it existed
    // previously.
    // For delete, remove the entry from the set.
    if (!exists) {
      const cache = this._typeDefinitionsCache.get(rootDir);
      if (cache) {
        cache.delete(filePath);
      }
    } else if (fileAndContent && fileAndContent.queries) {
      this.updateObjectTypeDefinition(
        rootDir,
        filePath,
        fileAndContent.queries,
      );
    }
  }

  _extendSchema(
    schema: GraphQLSchema,
    schemaPath: string | null,
    schemaCacheKey: string | null,
  ): GraphQLSchema {
    const graphQLFileMap = this._graphQLFileListCache.get(this._configDir);
    const typeExtensions: DefinitionNode[] = [];

    if (!graphQLFileMap) {
      return schema;
    }
    graphQLFileMap.forEach(({ filePath, asts }) => {
      asts.forEach(ast => {
        if (filePath === schemaPath) {
          return;
        }
        ast.definitions.forEach(definition => {
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
              typeExtensions.push(definition);
              break;
          }
        });
      });
    });

    if (schemaCacheKey) {
      const sorted = typeExtensions.sort((a: any, b: any) => {
        const aName = a.definition ? a.definition.name.value : a.name.value;
        const bName = b.definition ? b.definition.name.value : b.name.value;
        return aName > bName ? 1 : -1;
      });
      const hash = stringToHash(JSON.stringify(sorted));

      if (
        this._typeExtensionMap.has(schemaCacheKey) &&
        this._typeExtensionMap.get(schemaCacheKey) === hash
      ) {
        return schema;
      }

      this._typeExtensionMap.set(schemaCacheKey, hash);
    }

    return extendSchema(schema, {
      kind: DOCUMENT,
      definitions: typeExtensions,
    });
  }

  getSchema = async (
    appName?: string,
    queryHasExtensions?: boolean | null,
  ): Promise<GraphQLSchema | null> => {
    const projectConfig = this._graphQLConfig.getProject(appName);

    if (!projectConfig) {
      return null;
    }

    const schemaPath = projectConfig.schema as string;
    const schemaKey = this._getSchemaCacheKeyForProject(projectConfig);

    let schemaCacheKey = null;
    let schema = null;

    if (!schema && schemaPath && schemaKey) {
      schemaCacheKey = schemaKey as string;

      // Maybe use cache
      if (this._schemaMap.has(schemaCacheKey)) {
        schema = this._schemaMap.get(schemaCacheKey);
        if (schema) {
          return queryHasExtensions
            ? this._extendSchema(schema, schemaPath, schemaCacheKey)
            : schema;
        }
      }

      // Read from disk
      schema = await projectConfig.getSchema();
    }

    const customDirectives = projectConfig?.extensions?.customDirectives;
    if (customDirectives && schema) {
      const directivesSDL = customDirectives.join('\n\n');
      schema = extendSchema(schema, parse(directivesSDL));
    }

    if (!schema) {
      return null;
    }

    if (this._graphQLFileListCache.has(this._configDir)) {
      schema = this._extendSchema(schema, schemaPath, schemaCacheKey);
    }

    if (schemaCacheKey) {
      this._schemaMap.set(schemaCacheKey, schema);
    }
    return schema;
  };

  _invalidateSchemaCacheForProject(projectConfig: GraphQLProjectConfig) {
    const schemaKey = this._getSchemaCacheKeyForProject(
      projectConfig,
    ) as string;
    schemaKey && this._schemaMap.delete(schemaKey);
  }

  _getSchemaCacheKeyForProject(projectConfig: GraphQLProjectConfig) {
    return projectConfig.schema;
  }

  _getProjectName(projectConfig: GraphQLProjectConfig) {
    return projectConfig || 'default';
  }

  /**
   * Given a list of GraphQL file metadata, read all files collected from watchman
   * and create fragmentDefinitions and GraphQL files cache.
   */
  readAllGraphQLFiles = async (
    list: Array<GraphQLFileMetadata>,
  ): Promise<{
    objectTypeDefinitions: Map<string, ObjectTypeInfo>;
    fragmentDefinitions: Map<string, FragmentInfo>;
    graphQLFileMap: Map<string, GraphQLFileInfo>;
  }> => {
    const queue = list.slice(); // copy
    const responses: GraphQLFileInfo[] = [];
    while (queue.length) {
      const chunk = queue.splice(0, MAX_READS);
      const promises = chunk.map(fileInfo =>
        this.promiseToReadGraphQLFile(fileInfo.filePath)
          .catch(error => {
            console.log('pro', error);
            /**
             * fs emits `EMFILE | ENFILE` error when there are too many
             * open files - this can cause some fragment files not to be
             * processed.  Solve this case by implementing a queue to save
             * files failed to be processed because of `EMFILE` error,
             * and await on Promises created with the next batch from the
             * queue.
             */
            if (error.code === 'EMFILE' || error.code === 'ENFILE') {
              queue.push(fileInfo);
            }
          })
          .then((response: GraphQLFileInfo | void) => {
            if (response) {
              responses.push({
                ...response,
                mtime: fileInfo.mtime,
                size: fileInfo.size,
              });
            }
          }),
      );
      await Promise.all(promises); // eslint-disable-line no-await-in-loop
    }

    return this.processGraphQLFiles(responses);
  };

  /**
   * Takes an array of GraphQL File information and batch-processes into a
   * map of fragmentDefinitions and GraphQL file cache.
   */
  processGraphQLFiles = (
    responses: Array<GraphQLFileInfo>,
  ): {
    objectTypeDefinitions: Map<string, ObjectTypeInfo>;
    fragmentDefinitions: Map<string, FragmentInfo>;
    graphQLFileMap: Map<string, GraphQLFileInfo>;
  } => {
    const objectTypeDefinitions = new Map();
    const fragmentDefinitions = new Map();
    const graphQLFileMap = new Map();

    responses.forEach(response => {
      const { filePath, content, asts, mtime, size } = response;

      if (asts) {
        asts.forEach(ast => {
          ast.definitions.forEach(definition => {
            if (definition.kind === FRAGMENT_DEFINITION) {
              fragmentDefinitions.set(definition.name.value, {
                filePath,
                content,
                definition,
              });
            }
            if (
              definition.kind === OBJECT_TYPE_DEFINITION ||
              definition.kind === INPUT_OBJECT_TYPE_DEFINITION ||
              definition.kind === ENUM_TYPE_DEFINITION
            ) {
              objectTypeDefinitions.set(definition.name.value, {
                filePath,
                content,
                definition,
              });
            }
          });
        });
      }

      // Relay the previous object whether or not ast exists.
      graphQLFileMap.set(filePath, {
        filePath,
        content,
        asts,
        mtime,
        size,
      });
    });

    return {
      objectTypeDefinitions,
      fragmentDefinitions,
      graphQLFileMap,
    };
  };

  /**
   * Returns a Promise to read a GraphQL file and return a GraphQL metadata
   * including a parsed AST.
   */
  promiseToReadGraphQLFile = (filePath: Uri): Promise<GraphQLFileInfo> => {
    return new Promise((resolve, reject) =>
      fs.readFile(URI.parse(filePath).fsPath, 'utf8', (error, content) => {
        if (error) {
          reject(error);
          return;
        }

        const asts: DocumentNode[] = [];
        let queries: CachedContent[] = [];
        if (content.trim().length !== 0) {
          try {
            queries = this._parser(content, filePath);
            if (queries.length === 0) {
              // still resolve with an empty ast
              resolve({
                filePath,
                content,
                asts: [],
                queries: [],
                mtime: 0,
                size: 0,
              });
              return;
            }

            queries.forEach(({ query }) => asts.push(parse(query)));
            resolve({
              filePath,
              content,
              asts,
              queries,
              mtime: 0,
              size: 0,
            });
          } catch (_) {
            // If query has syntax errors, go ahead and still resolve
            // the filePath and the content, but leave ast empty.
            resolve({
              filePath,
              content,
              asts: [],
              queries: [],
              mtime: 0,
              size: 0,
            });
            return;
          }
        }
        resolve({ filePath, content, asts, queries, mtime: 0, size: 0 });
      }),
    );
  };
}
