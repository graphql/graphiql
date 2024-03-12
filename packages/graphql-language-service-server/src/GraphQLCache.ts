/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  ASTNode,
  DocumentNode,
  DefinitionNode,
  isTypeDefinitionNode,
  GraphQLSchema,
  Kind,
  extendSchema,
  parse,
  visit,
  Location,
  SourceLocation,
  Token,
  // Source,
  Source as GraphQLSource,
  printSchema,
} from 'graphql';
import type {
  CachedContent,
  GraphQLFileMetadata,
  GraphQLFileInfo,
  FragmentInfo,
  ObjectTypeInfo,
  Uri,
} from 'graphql-language-service';
import { gqlPluckFromCodeString } from '@graphql-tools/graphql-tag-pluck';
import { Position, Range } from 'graphql-language-service';
import { readFile, stat, writeFile } from 'node:fs/promises';
import nullthrows from 'nullthrows';

import {
  loadConfig,
  GraphQLConfig,
  GraphQLProjectConfig,
  GraphQLExtensionDeclaration,
} from 'graphql-config';
import { Source } from '@graphql-tools/utils';

import type { UnnormalizedTypeDefPointer } from '@graphql-tools/load';

import { parseDocument } from './parseDocument';
import stringToHash from './stringToHash';
import glob from 'glob';
import { LoadConfigOptions } from './types';
import { URI } from 'vscode-uri';
import { CodeFileLoader } from '@graphql-tools/code-file-loader';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { UrlLoader } from '@graphql-tools/url-loader';

import {
  DEFAULT_SUPPORTED_EXTENSIONS,
  DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
  SupportedExtensionsEnum,
} from './constants';
import { NoopLogger, Logger } from './Logger';
import path, { extname, resolve } from 'node:path';
import { file } from '@babel/types';
import {
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
} from 'vscode-languageserver';
import { existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const LanguageServiceExtension: GraphQLExtensionDeclaration = api => {
  // For schema
  api.loaders.schema.register(new CodeFileLoader());
  api.loaders.schema.register(new GraphQLFileLoader());
  api.loaders.schema.register(new UrlLoader());
  // For documents
  api.loaders.documents.register(new CodeFileLoader());
  api.loaders.documents.register(new GraphQLFileLoader());
  api.loaders.documents.register(new UrlLoader());

  return { name: 'languageService' };
};

// Maximum files to read when processing GraphQL files.
const MAX_READS = 200;

const graphqlRangeFromLocation = (location: Location): Range => {
  const locOffset = location.source.locationOffset;
  const start = location.startToken;
  const end = location.endToken;
  return new Range(
    new Position(
      start.line + locOffset.line - 1,
      start.column + locOffset.column - 1,
    ),
    new Position(
      end.line + locOffset.line - 1,
      end.column + locOffset.column - 1,
    ),
  );
};

export async function getGraphQLCache({
  parser,
  logger,
  loadConfigOptions,
  config,
  settings,
}: {
  parser: typeof parseDocument;
  logger: Logger | NoopLogger;
  loadConfigOptions: LoadConfigOptions;
  config?: GraphQLConfig;
  settings?: Record<string, any>;
}): Promise<GraphQLCache> {
  const graphQLConfig =
    config ||
    (await loadConfig({
      ...loadConfigOptions,
      extensions: [
        ...(loadConfigOptions?.extensions ?? []),
        LanguageServiceExtension,
      ],
    }));
  return new GraphQLCache({
    configDir: loadConfigOptions.rootDir!,
    config: graphQLConfig!,
    parser,
    logger,
    settings,
  });
}

export class GraphQLCache {
  _configDir: Uri;
  _graphQLFileListCache: Map<Uri, Map<string, GraphQLFileInfo>>;
  _graphQLConfig: GraphQLConfig;
  _schemaMap: Map<Uri, { schema: GraphQLSchema; localUri?: string }>;
  _typeExtensionMap: Map<Uri, number>;
  _fragmentDefinitionsCache: Map<Uri, Map<string, FragmentInfo>>;
  _typeDefinitionsCache: Map<Uri, Map<string, ObjectTypeInfo>>;
  _parser: typeof parseDocument;
  _logger: Logger | NoopLogger;
  private _tmpDir: any;
  private _tmpDirBase: string;
  private _settings?: Record<string, any>;

  constructor({
    configDir,
    config,
    parser,
    logger,
    tmpDir,
    settings,
  }: {
    configDir: Uri;
    config: GraphQLConfig;
    parser: typeof parseDocument;
    logger: Logger | NoopLogger;
    tmpDir?: string;
    settings?: Record<string, any>;
  }) {
    this._configDir = configDir;
    this._graphQLConfig = config;
    this._graphQLFileListCache = new Map();
    this._schemaMap = new Map();
    this._fragmentDefinitionsCache = new Map();
    this._typeDefinitionsCache = new Map();
    this._typeExtensionMap = new Map();
    this._parser = parser;
    this._logger = logger;
    this._tmpDir = tmpDir || tmpdir();
    this._tmpDirBase = path.join(this._tmpDir, 'graphql-language-service');
    this._settings = settings;
  }

  getGraphQLConfig = (): GraphQLConfig => this._graphQLConfig;

  /**
   *
   * @param uri system protocol path for the file, e.g. file:///path/to/file
   * @returns
   */
  getProjectForFile = (uri: string): GraphQLProjectConfig | void => {
    try {
      const project = this._graphQLConfig.getProjectForFile(
        URI.parse(uri).fsPath,
      );
      if (!project.documents) {
        this._logger.warn(
          `No documents configured for project ${project.name}. Many features will not work correctly.`,
        );
      }
      return project;
    } catch (err) {
      this._logger.error(
        `there was an error loading the project config for this file ${err}`,
      );
      return;
    }
  };
  private _getTmpProjectPath(
    project: GraphQLProjectConfig,
    prependWithProtocol = true,
    appendPath?: string,
  ) {
    const baseDir = this.getGraphQLConfig().dirpath;
    const workspaceName = path.basename(baseDir);
    const basePath = path.join(this._tmpDirBase, workspaceName);
    let projectTmpPath = path.join(basePath, 'projects', project.name);
    if (!existsSync(projectTmpPath)) {
      mkdirSync(projectTmpPath, {
        recursive: true,
      });
    }
    if (appendPath) {
      projectTmpPath = path.join(projectTmpPath, appendPath);
    }
    if (prependWithProtocol) {
      return URI.file(path.resolve(projectTmpPath)).toString();
    }
    return path.resolve(projectTmpPath);
  }
  private _unwrapProjectSchema(project: GraphQLProjectConfig): string[] {
    const projectSchema = project.schema;

    const schemas: string[] = [];
    if (typeof projectSchema === 'string') {
      schemas.push(projectSchema);
    } else if (Array.isArray(projectSchema)) {
      for (const schemaEntry of projectSchema) {
        if (typeof schemaEntry === 'string') {
          schemas.push(schemaEntry);
        } else if (schemaEntry) {
          schemas.push(...Object.keys(schemaEntry));
        }
      }
    } else {
      schemas.push(...Object.keys(projectSchema));
    }

    return schemas.reduce<string[]>((agg, schema) => {
      const results = this._globIfFilePattern(schema);
      return [...agg, ...results];
    }, []);
  }
  private _globIfFilePattern(pattern: string) {
    if (pattern.includes('*')) {
      try {
        return glob.sync(pattern);
        // URLs may contain * characters
      } catch {}
    }
    return [pattern];
  }

  private async _cacheConfigSchema(project: GraphQLProjectConfig) {
    try {
      const schema = await this.getSchema(project.name);
      if (schema) {
        let schemaText = printSchema(schema);
        // file:// protocol path
        const uri = this._getTmpProjectPath(
          project,
          true,
          'generated-schema.graphql',
        );

        // no file:// protocol for fs.writeFileSync()
        const fsPath = this._getTmpProjectPath(
          project,
          false,
          'generated-schema.graphql',
        );
        schemaText = `# This is an automatically generated representation of your schema.\n# Any changes to this file will be overwritten and will not be\n# reflected in the resulting GraphQL schema\n\n${schemaText}`;

        const cachedSchemaDoc = this._getCachedDocument(uri, project);
        this._schemaMap.set(
          this._getSchemaCacheKeyForProject(project) as string,
          { schema, localUri: uri },
        );
        if (!cachedSchemaDoc) {
          await writeFile(fsPath, schemaText, 'utf8');
          await this._cacheSchemaText(uri, schemaText, 0, project);
        }
        // do we have a change in the getSchema result? if so, update schema cache
        if (cachedSchemaDoc) {
          await writeFile(fsPath, schemaText, 'utf8');
          await this._cacheSchemaText(
            uri,
            schemaText,
            cachedSchemaDoc.version++,
            project,
          );
        }
        return {
          uri,
          fsPath,
        };
      }
    } catch (err) {
      this._logger.error(String(err));
    }
  }
  _cacheSchemaText = async (
    uri: string,
    text: string,
    version: number,
    project: GraphQLProjectConfig,
  ) => {
    const projectCacheKey = this._cacheKeyForProject(project);
    const projectCache = this._graphQLFileListCache.get(projectCacheKey);
    const ast = parse(text);
    console.log({ uri });
    if (projectCache) {
      const lines = text.split('\n');
      projectCache.set(uri, {
        filePath: uri,
        fsPath: URI.parse(uri).fsPath,
        source: text,
        contents: [
          {
            documentString: text,
            ast,
            range: new Range(
              new Position(0, 0),
              new Position(lines.length, lines.at(-1)?.length),
            ),
          },
        ],
        mtime: Math.trunc(new Date().getTime() / 1000),
        size: text.length,
        version,
      });

      projectCache.delete(project.schema.toString());

      this._setDefinitionCache(
        [{ documentString: text, ast, range: null }],
        this._typeDefinitionsCache.get(projectCacheKey) || new Map(),
        uri,
      );
      this._graphQLFileListCache.set(projectCacheKey, projectCache);
    }
  };

  _getCachedDocument(uri: string, project: GraphQLProjectConfig) {
    const projectCacheKey = this._cacheKeyForProject(project);
    const projectCache = this._graphQLFileListCache.get(projectCacheKey);
    return projectCache?.get(uri);
  }

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
    let parsedDocument;
    try {
      parsedDocument = parse(query);
    } catch {
      return [];
    }
    return this.getFragmentDependenciesForAST(
      parsedDocument,
      fragmentDefinitions,
    );
  };

  getFragmentDependenciesForAST = async (
    parsedDocument: ASTNode,
    fragmentDefinitions: Map<string, FragmentInfo>,
  ): Promise<FragmentInfo[]> => {
    if (!fragmentDefinitions) {
      return [];
    }

    const existingFrags = new Map();
    const referencedFragNames = new Set<string>();

    visit(parsedDocument, {
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
    for (const name of referencedFragNames) {
      if (!existingFrags.has(name) && fragmentDefinitions.has(name)) {
        asts.add(nullthrows(fragmentDefinitions.get(name)));
      }
    }

    const referencedFragments: FragmentInfo[] = [];

    for (const ast of asts) {
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
    }

    return referencedFragments;
  };

  _cacheKeyForProject = ({ dirpath, name }: GraphQLProjectConfig): string => {
    return `${dirpath}-${name}`;
  };

  getFragmentDefinitions = async (
    projectConfig: GraphQLProjectConfig,
  ): Promise<Map<string, FragmentInfo>> => {
    // This function may be called from other classes.
    // If then, check the cache first.
    const rootDir = projectConfig.dirpath;
    const cacheKey = this._cacheKeyForProject(projectConfig);
    if (this._fragmentDefinitionsCache.has(cacheKey)) {
      return this._fragmentDefinitionsCache.get(cacheKey) || new Map();
    }

    const { fragmentDefinitions, graphQLFileMap } =
      await this._buildCachesFromInputDirs(rootDir, projectConfig);
    this._fragmentDefinitionsCache.set(cacheKey, fragmentDefinitions);
    this._graphQLFileListCache.set(cacheKey, graphQLFileMap);

    return fragmentDefinitions;
  };

  getObjectTypeDependenciesForAST = async (
    parsedDocument: ASTNode,
    objectTypeDefinitions: Map<string, ObjectTypeInfo>,
  ): Promise<Array<ObjectTypeInfo>> => {
    if (!objectTypeDefinitions) {
      return [];
    }

    const existingObjectTypes = new Map();
    const referencedObjectTypes = new Set<string>();

    visit(parsedDocument, {
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
      UnionTypeDefinition(node) {
        existingObjectTypes.set(node.name.value, true);
      },
      ScalarTypeDefinition(node) {
        existingObjectTypes.set(node.name.value, true);
      },

      InterfaceTypeDefinition(node) {
        existingObjectTypes.set(node.name.value, true);
      },
    });

    const asts = new Set<ObjectTypeInfo>();
    for (const name of referencedObjectTypes) {
      if (!existingObjectTypes.has(name) && objectTypeDefinitions.has(name)) {
        asts.add(nullthrows(objectTypeDefinitions.get(name)));
      }
    }

    const referencedObjects: ObjectTypeInfo[] = [];

    for (const ast of asts) {
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
    }

    return referencedObjects;
  };

  getObjectTypeDefinitions = async (
    projectConfig: GraphQLProjectConfig,
  ): Promise<Map<string, ObjectTypeInfo>> => {
    // This function may be called from other classes.
    // If then, check the cache first.
    const rootDir = projectConfig.dirpath;
    const cacheKey = this._cacheKeyForProject(projectConfig);
    if (this._typeDefinitionsCache.has(cacheKey)) {
      return this._typeDefinitionsCache.get(cacheKey) || new Map();
    }
    const { objectTypeDefinitions, graphQLFileMap } =
      await this._buildCachesFromInputDirs(rootDir, projectConfig);
    this._typeDefinitionsCache.set(cacheKey, objectTypeDefinitions);
    this._graphQLFileListCache.set(cacheKey, graphQLFileMap);

    return objectTypeDefinitions;
  };

  public async readAndCacheFile(
    uri: string,
    changes?: TextDocumentContentChangeEvent[],
  ): Promise<{
    project?: GraphQLProjectConfig;
    projectCacheKey?: string;
    contents?: Array<CachedContent>;
  } | null> {
    const project = this.getProjectForFile(uri);
    if (!project) {
      return null;
    }
    let fileContents = null;
    const projectCacheKey = this._cacheKeyForProject(project);
    // on file change, patch the file with the changes
    // so we can handle any potential new graphql content (as well as re-compute offsets for code files)
    // before the changes have been saved to the file system
    if (changes) {
      // TODO: move this to a standalone function with unit tests!

      try {
        const fileText = await readFile(URI.parse(uri).fsPath, {
          encoding: 'utf-8',
        });
        let newFileText = fileText;
        for (const change of changes) {
          if ('range' in change) {
            // patch file with change range and text
            const { start, end } = change.range;
            const lines = newFileText.split('\n');
            const startLine = start.line;
            const endLine = end.line;

            const before = lines.slice(0, startLine).join('\n');
            const after = lines.slice(endLine + 1).join('\n');

            newFileText = `${before}${change.text}${after}`;
          }
        }
        if (
          DEFAULT_SUPPORTED_EXTENSIONS.includes(
            extname(uri) as SupportedExtensionsEnum,
          )
        ) {
          const result = await gqlPluckFromCodeString(uri, newFileText);
          const source = new GraphQLSource(result[0].body, result[0].name);
          source.locationOffset = result[0].locationOffset;

          const lines = result[0].body.split('\n');
          let document = null;
          try {
            document = parse(source);
          } catch (err) {
            console.error(err);
          }
          console.log({ offset: result[0].locationOffset });
          fileContents = [
            {
              rawSDL: result[0].body,
              document,
              range: graphqlRangeFromLocation({
                source: {
                  body: result[0].body,
                  locationOffset: result[0].locationOffset,
                  name: result[0].name,
                },
                startToken: {
                  line: 0,
                  column: 0,
                },
                endToken: {
                  line: lines.length,
                  column: lines.at(-1)?.length,
                },
              }),
            },
          ];
        } else if (
          DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS.includes(
            extname(uri) as SupportedExtensionsEnum,
          )
        ) {
          try {
            const source = new GraphQLSource(newFileText, uri);
            const lines = newFileText.split('\n');
            fileContents = [
              {
                rawSDL: newFileText,
                document: parse(source),
                range: {
                  start: { line: 0, character: 0 },
                  end: {
                    line: lines.length,
                    character: lines.at(-1)?.length,
                  },
                },
              },
            ];
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        fileContents =
          await project._extensionsRegistry.loaders.schema.loadTypeDefs(
            URI.parse(uri).fsPath,
            {
              cwd: project.dirpath,
              includeSources: true,
              assumeValid: false,
              noLocation: false,
              assumeValidSDL: false,
            },
          );
      } catch {
        fileContents = this._parser(
          await readFile(URI.parse(uri).fsPath, { encoding: 'utf-8' }),
          uri,
        ).map(c => {
          return {
            rawSDL: c.documentString,
            document: c.ast,
            range: c.range,
          };
        });
      }

      if (!fileContents?.length) {
        try {
          fileContents =
            await project._extensionsRegistry.loaders.documents.loadTypeDefs(
              URI.parse(uri).fsPath,
              {
                cwd: project.dirpath,
                includeSources: true,
                assumeValid: false,
                assumeValidSDL: false,
                noLocation: false,
              },
            );
        } catch {
          fileContents = this._parser(
            await readFile(URI.parse(uri).fsPath, { encoding: 'utf-8' }),
            uri,
          ).map(c => {
            return {
              rawSDL: c.documentString,
              document: c.ast,
              range: c.range,
            };
          });
        }
      }
      if (!fileContents.length) {
        return null;
      }
    }

    const asts = fileContents.map((doc: Source) => {
      return {
        ast: doc.document!,
        documentString: doc.document?.loc?.source.body ?? doc.rawSDL,
        range: doc.document?.loc
          ? graphqlRangeFromLocation(doc.document?.loc)
          : doc.range ?? null,
      };
    });

    this._setFragmentCache(
      asts,
      this._fragmentDefinitionsCache.get(projectCacheKey) || new Map(),
      uri,
    );

    this._setDefinitionCache(
      asts,
      this._typeDefinitionsCache.get(projectCacheKey) || new Map(),
      uri,
    );
    const { fsPath } = URI.parse(uri);
    const stats = await stat(fsPath);
    const source = await readFile(fsPath, { encoding: 'utf-8' });
    const projectFileCache =
      this._graphQLFileListCache.get(projectCacheKey) ?? new Map();
    const cachedDoc = projectFileCache?.get(uri);

    projectFileCache?.set(uri, {
      filePath: uri,
      fsPath,
      source,
      contents: asts,
      mtime: Math.trunc(stats.mtime.getTime() / 1000),
      size: stats.size,
      version: cachedDoc?.version ? cachedDoc.version++ : 0,
    });

    return {
      project,
      projectCacheKey,
      contents: asts,
    };
  }

  _buildCachesFromInputDirs = async (
    rootDir: string,
    projectConfig: GraphQLProjectConfig,
    options?: { maxReads?: number; schemaOnly?: boolean },
  ): Promise<{
    objectTypeDefinitions: Map<string, ObjectTypeInfo>;
    fragmentDefinitions: Map<string, FragmentInfo>;
    graphQLFileMap: Map<string, GraphQLFileInfo>;
  }> => {
    try {
      let documents: Source[] = [];

      if (!options?.schemaOnly) {
        try {
          documents =
            await projectConfig._extensionsRegistry.loaders.documents.loadTypeDefs(
              projectConfig.documents,
              {
                noLocation: false,
                assumeValid: false,
                assumeValidSDL: false,
                includeSources: true,
              },
            );
        } catch (err) {
          this._logger.log(String(err));
        }
      }

      let schemaDocuments: Source[] = [];
      // cache schema files
      try {
        schemaDocuments =
          await projectConfig._extensionsRegistry.loaders.schema.loadTypeDefs(
            projectConfig.schema,
            {
              noLocation: false,
              assumeValid: false,
              assumeValidSDL: false,
              includeSources: true,
            },
          );
      } catch (err) {
        this._logger.log(String(err));
      }

      // console.log('schemaDocuments', schemaDocuments);

      documents = [...documents, ...schemaDocuments];
      const graphQLFileMap = new Map<string, GraphQLFileInfo>();
      const fragmentDefinitions = new Map<string, FragmentInfo>();
      const objectTypeDefinitions = new Map<string, ObjectTypeInfo>();
      await Promise.all(
        documents.map(async doc => {
          if (!doc.rawSDL || !doc.document || !doc.location) {
            return;
          }
          let fsPath = doc.location;
          let filePath;
          const isNetwork = doc.location.startsWith('http');
          if (!isNetwork) {
            try {
              fsPath = resolve(rootDir, doc.location);
            } catch {}
            filePath = URI.file(fsPath).toString();
          } else {
            filePath = this._getTmpProjectPath(
              projectConfig,
              true,
              'generated-schema.graphql',
            );
            fsPath = this._getTmpProjectPath(
              projectConfig,
              false,
              'generated-schema.graphql',
            );
          }

          const content = doc.document.loc?.source.body ?? '';
          for (const definition of doc.document.definitions) {
            if (definition.kind === Kind.FRAGMENT_DEFINITION) {
              fragmentDefinitions.set(definition.name.value, {
                filePath,
                fsPath,
                content,
                definition,
              });
            } else if (isTypeDefinitionNode(definition)) {
              objectTypeDefinitions.set(definition.name.value, {
                uri: filePath,
                filePath,
                fsPath,
                content,
                definition,
              });
            }
          }
          // console.log(graphqlRangeFromLocation(doc.document.loc));
          if (graphQLFileMap.has(filePath)) {
            const cachedEntry = graphQLFileMap.get(filePath)!;
            graphQLFileMap.set(filePath, {
              ...cachedEntry,
              source: content,
              contents: [
                ...cachedEntry.contents,
                {
                  ast: doc.document,
                  documentString: doc.document.loc?.source.body ?? doc.rawSDL,
                  range: doc.document.loc
                    ? graphqlRangeFromLocation(doc.document.loc)
                    : null,
                },
              ],
            });
          } else {
            let mtime = new Date();
            let size = 0;
            if (!isNetwork) {
              try {
                const stats = await stat(fsPath);
                mtime = stats.mtime;
                size = stats.size;
              } catch {}
            }

            graphQLFileMap.set(filePath, {
              filePath,
              fsPath,
              source: content,
              version: 0,
              contents: [
                {
                  ast: doc.document,
                  documentString: doc.document.loc?.source.body ?? doc.rawSDL,
                  range: doc.document.loc
                    ? graphqlRangeFromLocation(doc.document.loc)
                    : null,
                },
              ],
              mtime: Math.trunc(mtime.getTime() / 1000),
              size,
            });
          }
        }),
      );

      return {
        graphQLFileMap,
        fragmentDefinitions,
        objectTypeDefinitions,
      };
    } catch (err) {
      this._logger.error(`Error building caches from input dirs: ${err}`);
      return {
        graphQLFileMap: new Map(),
        fragmentDefinitions: new Map(),
        objectTypeDefinitions: new Map(),
      };
    }
  };

  async updateFragmentDefinition(
    projectCacheKey: Uri,
    filePath: Uri,
    contents: Array<CachedContent>,
  ): Promise<void> {
    const cache = this._fragmentDefinitionsCache.get(projectCacheKey);
    const asts = contents.map(({ documentString, range, ast }) => {
      try {
        return {
          ast: ast ?? parse(documentString),
          documentString,
          range,
        };
      } catch {
        return { ast: null, documentString, range };
      }
    });
    if (cache) {
      // first go through the fragment list to delete the ones from this file
      for (const [key, value] of cache.entries()) {
        if (value.filePath === filePath) {
          cache.delete(key);
        }
      }
      this._setFragmentCache(asts, cache, filePath);
    } else {
      const newFragmentCache = this._setFragmentCache(
        asts,
        new Map(),
        filePath,
      );
      this._fragmentDefinitionsCache.set(projectCacheKey, newFragmentCache);
    }
  }
  _setFragmentCache(
    asts: CachedContent[],
    fragmentCache: Map<string, FragmentInfo>,
    filePath: string | undefined,
  ) {
    for (const { ast, documentString } of asts) {
      if (!ast) {
        continue;
      }
      for (const definition of ast.definitions) {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          fragmentCache.set(definition.name.value, {
            filePath,
            content: documentString,
            definition,
          });
        }
      }
    }
    return fragmentCache;
  }

  async updateObjectTypeDefinition(
    projectCacheKey: Uri,
    filePath: Uri,
    contents: Array<CachedContent>,
  ): Promise<void> {
    const cache = this._typeDefinitionsCache.get(projectCacheKey);
    const asts = contents.map(({ documentString, range, ast }) => {
      try {
        return {
          ast,
          documentString,
          range: range ?? null,
        };
      } catch {
        return { ast: null, documentString, range: range ?? null };
      }
    });
    if (cache) {
      // first go through the types list to delete the ones from this file
      for (const [key, value] of cache.entries()) {
        if (value.filePath === filePath) {
          cache.delete(key);
        }
      }
      this._setDefinitionCache(asts, cache, filePath);
    } else {
      const newTypeCache = this._setDefinitionCache(asts, new Map(), filePath);
      this._typeDefinitionsCache.set(projectCacheKey, newTypeCache);
    }
  }
  _setDefinitionCache(
    asts: CachedContent[],
    typeCache: Map<string, ObjectTypeInfo>,
    filePath: string | undefined,
  ) {
    for (const { ast, documentString } of asts) {
      if (!ast) {
        continue;
      }
      for (const definition of ast.definitions) {
        if (isTypeDefinitionNode(definition)) {
          typeCache.set(definition.name.value, {
            filePath,
            uri: filePath,
            fsPath: filePath,
            content: documentString,
            definition,
          });
        }
      }
    }
    return typeCache;
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
    for (const { filePath, contents } of graphQLFileMap.values()) {
      for (const { ast } of contents) {
        if (!ast) {
          continue;
        }
        if (filePath === schemaPath) {
          continue;
        }
        for (const definition of ast.definitions) {
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
              typeExtensions.push(definition);
              break;
          }
        }
      }
    }

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
      kind: Kind.DOCUMENT,
      definitions: typeExtensions,
    });
  }

  getSchema = async (
    projectName: string,
    queryHasExtensions?: boolean | null,
  ): Promise<GraphQLSchema | null> => {
    const projectConfig = this._graphQLConfig.getProject(projectName);

    if (!projectConfig) {
      return null;
    }

    const schemaPath = projectConfig.schema as string;
    const schemaKey = this._getSchemaCacheKeyForProject(projectConfig);

    let schemaCacheKey = null;
    let schema: { schema?: GraphQLSchema; localUri?: string } = {};

    if (schemaPath && schemaKey) {
      schemaCacheKey = schemaKey as string;

      if (this._schemaMap.has(schemaCacheKey)) {
        schema = this._schemaMap.get(schemaCacheKey) as {
          schema: GraphQLSchema;
          localUri?: string;
        };
        if (schema.schema) {
          return queryHasExtensions
            ? this._extendSchema(schema.schema, schemaPath, schemaCacheKey)
            : schema.schema;
        }
      }
      try {
        // Read from disk
        schema.schema = await projectConfig.getSchema();
      } catch {
        // // if there is an error reading the schema, just use the last valid schema
        schema = this._schemaMap.get(schemaCacheKey);
      }
    }

    if (!schema.schema) {
      return null;
    }

    const customDirectives = projectConfig?.extensions?.customDirectives;
    if (customDirectives) {
      const directivesSDL = customDirectives.join('\n\n');
      schema.schema = extendSchema(schema.schema, parse(directivesSDL));
    }

    if (this._graphQLFileListCache.has(this._configDir)) {
      schema.schema = this._extendSchema(
        schema.schema,
        schemaPath,
        schemaCacheKey,
      );
    }

    if (schemaCacheKey) {
      this._schemaMap.set(
        schemaCacheKey,
        schema as {
          schema: GraphQLSchema;
          localUri?: string;
        },
      );
      await this.maybeCacheSchemaFile(projectConfig);
    }
    return schema.schema;
  };
  private async maybeCacheSchemaFile(projectConfig: GraphQLProjectConfig) {
    const cacheSchemaFileForLookup =
      projectConfig.extensions.languageService?.cacheSchemaFileForLookup ??
      this?._settings?.cacheSchemaFileForLookup ??
      true;
    const unwrappedSchema = this._unwrapProjectSchema(projectConfig);
    const allExtensions = [
      ...DEFAULT_SUPPORTED_EXTENSIONS,
      ...DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
    ];

    // // only local schema lookups if all of the schema entries are local files
    const sdlOnly = unwrappedSchema.every(schemaEntry =>
      allExtensions.some(
        // local schema file URIs for lookup don't start with http, and end with an extension.
        // though it isn't often used, technically schema config could include a remote .graphql file
        ext => !schemaEntry.startsWith('http') && schemaEntry.endsWith(ext),
      ),
    );
    console.log({ unwrappedSchema, sdlOnly, cacheSchemaFileForLookup });
    if (!sdlOnly && cacheSchemaFileForLookup) {
      const result = await this._cacheConfigSchema(projectConfig);
      if (result) {
        const { uri, fsPath } = result;
        return { uri, fsPath, sdlOnly };
      }
    }
    return { sdlOnly };
  }
  invalidateSchemaCacheForProject(projectConfig: GraphQLProjectConfig) {
    const schemaKey = this._getSchemaCacheKeyForProject(
      projectConfig,
    ) as string;
    if (schemaKey) {
      this._schemaMap.delete(schemaKey);
    }
  }

  _getSchemaCacheKeyForProject(
    projectConfig: GraphQLProjectConfig,
  ): UnnormalizedTypeDefPointer {
    return projectConfig.schema;
  }

  _getProjectName(projectConfig: GraphQLProjectConfig) {
    return projectConfig?.name || 'default';
  }
}
