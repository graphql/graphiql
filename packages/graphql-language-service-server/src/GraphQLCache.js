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
import type {
  GraphQLConfig as GraphQLConfigInterface,
  GraphQLFileMetadata,
  GraphQLFileInfo,
  FragmentInfo,
  Uri,
} from 'graphql-language-service-types';

import fs from 'fs';
import path from 'path';
import {
  GraphQLSchema,
  buildSchema,
  buildClientSchema,
  parse,
  visit,
} from 'graphql';
import nullthrows from 'nullthrows';

import {FRAGMENT_DEFINITION} from 'graphql/language/kinds';
import {getGraphQLConfig, GraphQLConfig} from 'graphql-language-service-config';
import {GraphQLWatchman} from './GraphQLWatchman';

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
    graphQLConfig: GraphQLConfigInterface,
    appName: ?string,
  ): Promise<Map<string, FragmentInfo>> => {
    // This function may be called from other classes.
    // If then, check the cache first.
    const rootDir = graphQLConfig.getRootDir();
    if (this._fragmentDefinitionsCache.has(rootDir)) {
      return this._fragmentDefinitionsCache.get(rootDir) || new Map();
    }

    const inputDirs = graphQLConfig.getInputDirs(appName);
    const excludeDirs = graphQLConfig.getExcludeDirs(appName);
    const filesFromInputDirs = await this._watchmanClient.listFiles(rootDir, {
      path: inputDirs,
    });

    const list = filesFromInputDirs
      .map(fileInfo => ({
        filePath: path.join(rootDir, fileInfo.name),
        size: fileInfo.size,
        mtime: fileInfo.mtime,
        // Filter any files with path starting with ExcludeDirs
      }))
      .filter(fileInfo =>
        excludeDirs.every(
          exclude => !fileInfo.filePath.startsWith(path.join(rootDir, exclude)),
        ));

    const {fragmentDefinitions, graphQLFileMap} = await readAllGraphQLFiles(
      list,
    );

    this._fragmentDefinitionsCache.set(rootDir, fragmentDefinitions);
    this._graphQLFileListCache.set(rootDir, graphQLFileMap);

    this._subscribeToFileChanges(rootDir, inputDirs, excludeDirs);

    return fragmentDefinitions;
  };

  /**
   * Subscribes to the file changes and update the cache accordingly.
   * @param `rootDir` the directory of config path
   */
  _subscribeToFileChanges(
    rootDir: Uri,
    inputDirs: Array<Uri>,
    excludeDirs: Array<Uri>,
  ): void {
    this._watchmanClient.subscribe(this._configDir, result => {
      if (result.files && result.files.length > 0) {
        const graphQLFileMap = this._graphQLFileListCache.get(rootDir);
        if (!graphQLFileMap) {
          return;
        }
        result.files.forEach(async ({name, exists, size, mtime}) => {
          // Prune the file using the input/excluded directories
          if (
            !inputDirs.some(dir => name.startsWith(dir)) ||
            excludeDirs.some(dir => name.startsWith(dir))
          ) {
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

            const fileAndContent = await promiseToReadGraphQLFile(filePath);
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
            const fragmentDefinitionCache = this._fragmentDefinitionsCache.get(
              rootDir,
            );
            if (fragmentDefinitionCache) {
              this._fragmentDefinitionsCache.set(
                rootDir,
                await this._updateFragmentDefinitionCache(
                  fragmentDefinitionCache,
                  filePath,
                  exists,
                ),
              );
            }
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
      ? await promiseToReadGraphQLFile(filePath)
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

  async _updateFragmentDefinitionCache(
    fragmentDefinitionCache: Map<Uri, FragmentInfo>,
    filePath: Uri,
    exists: boolean,
  ): Promise<Map<Uri, FragmentInfo>> {
    const fileAndContent = exists
      ? await promiseToReadGraphQLFile(filePath)
      : null;
    // In the case of fragment definitions, the cache could just map the
    // definition name to the parsed ast, whether or not it existed
    // previously.
    // For delete, remove the entry from the set.
    // For cases where the modified content has syntax error and therefore
    // cannot be parsed, maintain the previous cache (do nothing).
    if (!exists) {
      fragmentDefinitionCache.delete(filePath);
    } else if (fileAndContent && fileAndContent.ast) {
      fileAndContent.ast.definitions.forEach(definition => {
        if (definition.kind === FRAGMENT_DEFINITION) {
          fragmentDefinitionCache.set(definition.name.value, {
            filePath: fileAndContent.filePath,
            content: fileAndContent.content,
            definition,
          });
        }
      });
    }

    return fragmentDefinitionCache;
  }

  getSchema = async (configSchemaPath: ?Uri): Promise<?GraphQLSchema> => {
    if (!configSchemaPath) {
      return null;
    }
    const schemaPath = path.join(this._configDir, configSchemaPath);
    if (this._schemaMap.has(schemaPath)) {
      return this._schemaMap.get(schemaPath);
    }

    const schemaDSL = await new Promise(resolve =>
      fs.readFile(schemaPath, 'utf8', (error, content) => {
        if (error) {
          throw new Error(error);
        }
        resolve(content);
      }));

    const schemaFileExt = path.extname(schemaPath);
    let schema;
    try {
      switch (schemaFileExt) {
        case '.graphql':
          schema = buildSchema(schemaDSL);
          break;
        case '.json':
          schema = buildClientSchema(JSON.parse(schemaDSL));
          break;
        default:
          throw new Error('Unsupported schema file extention');
      }
    } catch (error) {
      throw new Error(error);
    }

    this._schemaMap.set(schemaPath, schema);
    return schema;
  };
}

/**
 * Given a list of GraphQL file metadata, read all files collected from watchman
 * and create fragmentDefinitions and GraphQL files cache.
 */
async function readAllGraphQLFiles(
  list: Array<GraphQLFileMetadata>,
): Promise<{
  fragmentDefinitions: Map<string, FragmentInfo>,
  graphQLFileMap: Map<string, GraphQLFileInfo>,
}> {
  const queue = list.slice(); // copy
  const responses = [];
  while (queue.length) {
    const chunk = queue.splice(0, MAX_READS);
    const promises = chunk.map(fileInfo =>
      promiseToReadGraphQLFile(fileInfo.filePath)
        .catch(error => {
          /**
         * fs emits `EMFILE | ENFILE` error when there are too many open files -
         * this can cause some fragment files not to be processed.
         * Solve this case by implementing a queue to save files failed to be
         * processed because of `EMFILE` error, and await on Promises created
         * with the next batch from the queue.
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
          })));
    await Promise.all(promises); // eslint-disable-line babel/no-await-in-loop
  }

  return processGraphQLFiles(responses);
}

/**
 * Takes an array of GraphQL File information and batch-processes into a
 * map of fragmentDefinitions and GraphQL file cache.
 */
function processGraphQLFiles(
  responses: Array<GraphQLFileInfo>,
): {
  fragmentDefinitions: Map<string, FragmentInfo>,
  graphQLFileMap: Map<string, GraphQLFileInfo>,
} {
  const fragmentDefinitions = new Map();
  const graphQLFileMap = new Map();

  responses.forEach(response => {
    const {filePath, content, ast, mtime, size} = response;

    if (ast) {
      ast.definitions.forEach(definition => {
        if (definition.kind === FRAGMENT_DEFINITION) {
          fragmentDefinitions.set(definition.name.value, {
            filePath,
            content,
            definition,
          });
        }
      });
    }

    // Relay the previous object whether or not ast exists.
    graphQLFileMap.set(filePath, {
      filePath,
      content,
      ast,
      mtime,
      size,
    });
  });

  return {fragmentDefinitions, graphQLFileMap};
}

/**
 * Returns a Promise to read a GraphQL file and return a GraphQL metadata
 * including a parsed AST.
 */
function promiseToReadGraphQLFile(
  filePath: Uri,
): Promise<{
  filePath: Uri,
  content: string,
  ast: ?ASTNode,
}> {
  return new Promise((resolve, reject) =>
    fs.readFile(filePath, 'utf8', (error, content) => {
      if (error) {
        reject(error);
        return;
      }

      let ast = null;
      if (content.trim().length !== 0) {
        try {
          ast = parse(content);
        } catch (_) {
          // If query has syntax errors, go ahead and still resolve
          // the filePath and the content, but leave ast with null.
          resolve({filePath, content, ast: null});
          return;
        }
      }
      resolve({filePath, content, ast});
    }));
}
