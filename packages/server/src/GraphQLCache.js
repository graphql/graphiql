/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {ASTNode, DocumentNode} from 'graphql/language';
import type {
  CachedContent,
  GraphQLConfig as GraphQLConfigInterface,
  GraphQLFileMetadata,
  GraphQLFileInfo,
  FragmentInfo,
  Uri,
  GraphQLProjectConfig,
} from 'graphql-language-service-types';

import fs from 'fs';
import path from 'path';
import {GraphQLSchema, extendSchema, parse, visit} from 'graphql';
import nullthrows from 'nullthrows';

import {
  DOCUMENT,
  FRAGMENT_DEFINITION,
  OBJECT_TYPE_DEFINITION,
  INTERFACE_TYPE_DEFINITION,
  ENUM_TYPE_DEFINITION,
  UNION_TYPE_DEFINITION,
  SCALAR_TYPE_DEFINITION,
  INPUT_OBJECT_TYPE_DEFINITION,
  TYPE_EXTENSION_DEFINITION,
  DIRECTIVE_DEFINITION,
} from 'graphql/language/kinds';
import {getGraphQLConfig, GraphQLConfig} from 'graphql-config';
import {GraphQLWatchman} from './GraphQLWatchman';
import {getQueryAndRange} from './MessageProcessor';
import stringToHash from './stringToHash';

// Maximum files to read when processing GraphQL files.
const MAX_READS = 200;

export async function getGraphQLCache(configDir: Uri): Promise<GraphQLCache> {
  const graphQLConfig = await getGraphQLConfig(configDir);
  const watchmanClient = new GraphQLWatchman();
  watchmanClient.checkVersion();
  watchmanClient.watchProject(configDir);
  return new GraphQLCache(configDir, graphQLConfig, watchmanClient);
}

export class GraphQLCache {
  _configDir: Uri;
  _graphQLFileListCache: Map<Uri, Map<string, GraphQLFileInfo>>;
  _graphQLConfig: GraphQLConfig;
  _watchmanClient: GraphQLWatchman;
  _cachePromise: Promise<void>;
  _schemaMap: Map<Uri, GraphQLSchema>;
  _typeExtensionMap: Map<Uri, number>;
  _fragmentDefinitionsCache: Map<Uri, Map<string, FragmentInfo>>;

  constructor(
    configDir: Uri,
    graphQLConfig: GraphQLConfig,
    watchmanClient: GraphQLWatchman,
  ): void {
    this._configDir = configDir;
    this._graphQLConfig = graphQLConfig;
    this._watchmanClient = watchmanClient || new GraphQLWatchman();
    this._graphQLFileListCache = new Map();
    this._schemaMap = new Map();
    this._fragmentDefinitionsCache = new Map();
    this._typeExtensionMap = new Map();
  }

  getGraphQLConfig = (): GraphQLConfigInterface => this._graphQLConfig;

  getFragmentDependencies = async (
    query: string,
    fragmentDefinitions: ?Map<string, FragmentInfo>,
  ): Promise<Array<FragmentInfo>> => {
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
  ): Promise<Array<FragmentInfo>> => {
    if (!fragmentDefinitions) {
      return [];
    }

    const existingFrags = new Map();
    const referencedFragNames = new Set();

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

    const asts = new Set();
    referencedFragNames.forEach(name => {
      if (!existingFrags.has(name) && fragmentDefinitions.has(name)) {
        asts.add(nullthrows(fragmentDefinitions.get(name)));
      }
    });

    const referencedFragments = [];

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
    const rootDir = projectConfig.configDir;
    if (this._fragmentDefinitionsCache.has(rootDir)) {
      return this._fragmentDefinitionsCache.get(rootDir) || new Map();
    }

    const includes = projectConfig.includes.map(
      filePath => filePath.split('*')[0],
    );
    const filesFromInputDirs = await this._watchmanClient.listFiles(rootDir, {
      path: includes,
    });

    const list = filesFromInputDirs
      .map(fileInfo => ({
        filePath: path.join(rootDir, fileInfo.name),
        size: fileInfo.size,
        mtime: fileInfo.mtime,
      }))
      .filter(fileInfo => projectConfig.includesFile(fileInfo.filePath));

    const {
      fragmentDefinitions,
      graphQLFileMap,
    } = await this.readAllGraphQLFiles(list);

    this._fragmentDefinitionsCache.set(rootDir, fragmentDefinitions);
    this._graphQLFileListCache.set(rootDir, graphQLFileMap);

    this._subscribeToFileChanges(rootDir, projectConfig);

    return fragmentDefinitions;
  };

  /**
   * Subscribes to the file changes and update the cache accordingly.
   * @param `rootDir` the directory of config path
   */
  _subscribeToFileChanges(
    rootDir: Uri,
    projectConfig: GraphQLProjectConfig,
  ): void {
    this._watchmanClient.subscribe(this._configDir, result => {
      if (result.files && result.files.length > 0) {
        const graphQLFileMap = this._graphQLFileListCache.get(rootDir);
        if (!graphQLFileMap) {
          return;
        }
        result.files.forEach(async ({name, exists, size, mtime}) => {
          // Prune the file using the input/excluded directories
          if (!projectConfig.includesFile(name)) {
            return;
          }
          const filePath = path.join(result.root, result.subscription, name);

          // In the event of watchman recrawl (is_fresh_instance),
          // watchman subscription returns a full set of files within the
          // watched directory. After pruning with input/excluded directories,
          // the file could have been created/modified.
          // Using the cached size/mtime information, only cache the file if
          // the file doesn't exist or the file exists and one of or both
          // size/mtime is different.
          if (result.is_fresh_instance && exists) {
            const existingFile = graphQLFileMap.get(filePath);
            // Same size/mtime means the file stayed the same
            if (
              existingFile &&
              existingFile.size === size &&
              existingFile.mtime === mtime
            ) {
              return;
            }

            const fileAndContent = await this.promiseToReadGraphQLFile(
              filePath,
            );
            graphQLFileMap.set(filePath, {
              ...fileAndContent,
              size,
              mtime,
            });
            // Otherwise, create/update the cache with the updated file and
            // content, or delete the cache if (!exists)
          } else {
            if (graphQLFileMap) {
              this._graphQLFileListCache.set(
                rootDir,
                await this._updateGraphQLFileListCache(
                  graphQLFileMap,
                  {size, mtime},
                  filePath,
                  exists,
                ),
              );
            }

            this._updateFragmentDefinitionCache(rootDir, filePath, exists);
          }
        });
      }
    });
  }

  async _updateGraphQLFileListCache(
    graphQLFileMap: Map<Uri, GraphQLFileInfo>,
    metrics: {size: number, mtime: number},
    filePath: Uri,
    exists: boolean,
  ): Promise<Map<Uri, GraphQLFileInfo>> {
    const fileAndContent = exists
      ? await this.promiseToReadGraphQLFile(filePath)
      : null;
    const graphQLFileInfo = {...fileAndContent, ...metrics};

    const existingFile = graphQLFileMap.get(filePath);

    // 3 cases for the cache invalidation: create/modify/delete.
    // For create/modify, swap the existing entry if available;
    // otherwise, just push in the new entry created.
    // For delete, check `exists` and splice the file out.
    if (existingFile && !exists) {
      graphQLFileMap.delete(filePath);
    } else if (graphQLFileInfo) {
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
    const asts = contents.map(({query}) => {
      try {
        return {ast: parse(query), query};
      } catch (error) {
        return {ast: null, query};
      }
    });
    if (cache) {
      // first go through the fragment list to delete the ones from this file
      cache.forEach((value, key) => {
        if (value.filePath === filePath) {
          cache.delete(key);
        }
      });
      asts.forEach(({ast, query}) => {
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

  async _updateFragmentDefinitionCache(
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

  _extendSchema(
    schema: GraphQLSchema,
    schemaPath: string,
    projectName: string,
  ): GraphQLSchema {
    const graphQLFileMap = this._graphQLFileListCache.get(this._configDir);
    const typeExtensions = [];

    if (!graphQLFileMap) {
      return schema;
    }
    graphQLFileMap.forEach(({filePath, asts}) => {
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
            case TYPE_EXTENSION_DEFINITION:
            case DIRECTIVE_DEFINITION:
              typeExtensions.push(definition);
              break;
          }
        });
      });
    });
    const sorted = typeExtensions.sort((a: any, b: any) => {
      const aName = a.definition ? a.definition.name.value : a.name.value;
      const bName = b.definition ? b.definition.name.value : b.name.value;
      return aName > bName ? 1 : -1;
    });

    const hash = stringToHash(JSON.stringify(sorted));
    const typeExtCacheKey = `${schemaPath}:${projectName}`;
    if (
      this._typeExtensionMap.has(typeExtCacheKey) &&
      this._typeExtensionMap.get(typeExtCacheKey) === hash
    ) {
      return schema;
    }

    this._typeExtensionMap.set(typeExtCacheKey, hash);
    return extendSchema(schema, {
      kind: DOCUMENT,
      definitions: typeExtensions,
    });
  }

  getSchema = async (
    appName: ?string,
    queryHasExtensions?: ?boolean = false,
  ): Promise<?GraphQLSchema> => {
    const projectConfig = this._graphQLConfig.getProjectConfig(appName);

    if (!projectConfig || !projectConfig.schemaPath) {
      return null;
    }

    const projectName = appName || 'undefinedName';

    const schemaPath = projectConfig.schemaPath;
    const schemaCacheKey = `${schemaPath}:${projectName}`;

    if (this._schemaMap.has(schemaCacheKey)) {
      const schema = this._schemaMap.get(schemaCacheKey);
      return schema && queryHasExtensions
        ? this._extendSchema(schema, schemaPath, projectName)
        : schema;
    }

    let schema = projectConfig.getSchema();

    const customDirectives = projectConfig.extensions.customDirectives;
    if (customDirectives && schema) {
      const directivesSDL = customDirectives.join('\n\n');
      schema = extendSchema(schema, parse(directivesSDL));
    }

    if (!schema) {
      return null;
    }

    if (this._graphQLFileListCache.has(this._configDir)) {
      schema = this._extendSchema(schema, schemaPath, projectName);
    }

    this._schemaMap.set(schemaCacheKey, schema);
    return schema;
  };

  /**
  * Given a list of GraphQL file metadata, read all files collected from watchman
  * and create fragmentDefinitions and GraphQL files cache.
  */
  readAllGraphQLFiles = async (
    list: Array<GraphQLFileMetadata>,
  ): Promise<{
    fragmentDefinitions: Map<string, FragmentInfo>,
    graphQLFileMap: Map<string, GraphQLFileInfo>,
  }> => {
    const queue = list.slice(); // copy
    const responses = [];
    while (queue.length) {
      const chunk = queue.splice(0, MAX_READS);
      const promises = chunk.map(fileInfo =>
        this.promiseToReadGraphQLFile(fileInfo.filePath)
          .catch(error => {
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
          .then(response =>
            responses.push({
              ...response,
              mtime: fileInfo.mtime,
              size: fileInfo.size,
            }),
          ),
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
    fragmentDefinitions: Map<string, FragmentInfo>,
    graphQLFileMap: Map<string, GraphQLFileInfo>,
  } => {
    const fragmentDefinitions = new Map();
    const graphQLFileMap = new Map();

    responses.forEach(response => {
      const {filePath, content, asts, mtime, size} = response;

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

    return {fragmentDefinitions, graphQLFileMap};
  };

  /**
  * Returns a Promise to read a GraphQL file and return a GraphQL metadata
  * including a parsed AST.
  */
  promiseToReadGraphQLFile = (
    filePath: Uri,
  ): Promise<{
    filePath: Uri,
    content: string,
    asts: Array<DocumentNode>,
    queries: Array<CachedContent>,
  }> => {
    return new Promise((resolve, reject) =>
      fs.readFile(filePath, 'utf8', (error, content) => {
        if (error) {
          reject(error);
          return;
        }

        const asts = [];
        let queries = [];
        if (content.trim().length !== 0) {
          try {
            queries = getQueryAndRange(content, filePath);
            if (queries.length === 0) {
              // still resolve with an empty ast
              resolve({filePath, content, asts: [], queries: []});
              return;
            }

            queries.forEach(({query}) => asts.push(parse(query)));
          } catch (_) {
            // If query has syntax errors, go ahead and still resolve
            // the filePath and the content, but leave ast empty.
            resolve({filePath, content, asts: [], queries: []});
            return;
          }
        }
        resolve({filePath, content, asts, queries});
      }),
    );
  };
}
