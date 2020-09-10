/**
 *  Copyright (c) 2020 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import mkdirp from 'mkdirp';
import { readFileSync, existsSync, writeFileSync, writeFile } from 'fs';
import { URL } from 'url';
import * as path from 'path';
import {
  CachedContent,
  GraphQLCache,
  Uri,
  GraphQLConfig,
  GraphQLProjectConfig,
} from 'graphql-language-service';

import {
  GraphQLLanguageService,
  FileChangeTypeKind,
} from 'graphql-language-service';

import { Range, Position } from 'graphql-language-service-utils';

import type {
  CompletionParams,
  FileEvent,
  VersionedTextDocumentIdentifier,
  DidSaveTextDocumentParams,
  DidOpenTextDocumentParams,
} from 'vscode-languageserver-protocol';

import type {
  Diagnostic,
  CompletionItem,
  CompletionList,
  CancellationToken,
  Hover,
  InitializeResult,
  Location,
  PublishDiagnosticsParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidChangeWatchedFilesParams,
  InitializeParams,
  Range as RangeType,
  TextDocumentPositionParams,
  DocumentSymbolParams,
  SymbolInformation,
  WorkspaceSymbolParams,
  IConnection,
} from 'vscode-languageserver';

import type { UnnormalizedTypeDefPointer } from '@graphql-tools/load';

import { getGraphQLCache } from './GraphQLCache';
import { parseDocument, DEFAULT_SUPPORTED_EXTENSIONS } from './parseDocument';

import { Logger } from './Logger';
import { printSchema, visit, parse, FragmentDefinitionNode } from 'graphql';
import { tmpdir } from 'os';
import { GraphQLExtensionDeclaration } from 'graphql-config';
import type { LoadConfigOptions } from './types';
import { promisify } from 'util';

const writeFileAsync = promisify(writeFile);

type CachedDocumentType = {
  version: number;
  contents: CachedContent[];
};

export class MessageProcessor {
  _connection: IConnection;
  _graphQLCache!: GraphQLCache;
  _graphQLConfig: GraphQLConfig | undefined;
  _languageService!: GraphQLLanguageService;
  _textDocumentCache: Map<string, CachedDocumentType>;
  _isInitialized: boolean;
  _willShutdown: boolean;
  _logger: Logger;
  _extensions?: GraphQLExtensionDeclaration[];
  _parser: (text: string, uri: string) => CachedContent[];
  _tmpDir: string;
  _tmpUriBase: string;
  _tmpDirBase: string;
  _loadConfigOptions: LoadConfigOptions;
  _schemaCacheInit: boolean = false;
  _rootPath: string = process.cwd();

  constructor({
    logger,
    fileExtensions,
    graphqlFileExtensions,
    loadConfigOptions,
    config,
    parser,
    tmpDir,
    connection,
  }: {
    logger: Logger;
    fileExtensions: string[];
    graphqlFileExtensions: string[];
    loadConfigOptions: LoadConfigOptions;
    config?: GraphQLConfig;
    parser?: typeof parseDocument;
    tmpDir?: string;
    connection: IConnection;
  }) {
    this._connection = connection;
    this._textDocumentCache = new Map();
    this._isInitialized = false;
    this._willShutdown = false;
    this._logger = logger;
    this._graphQLConfig = config;
    this._parser = (text, uri) => {
      const p = parser ?? parseDocument;
      return p(text, uri, fileExtensions, graphqlFileExtensions);
    };
    this._tmpDir = tmpDir || tmpdir();
    this._tmpDirBase = path.join(this._tmpDir, 'graphql-language-service');
    this._tmpUriBase = path.join('file://', this._tmpDirBase);
    this._loadConfigOptions = loadConfigOptions;
    if (
      loadConfigOptions.extensions &&
      loadConfigOptions.extensions?.length > 0
    ) {
      this._extensions = loadConfigOptions.extensions;
    }

    if (!existsSync(this._tmpDirBase)) {
      mkdirp(this._tmpDirBase);
    }
  }
  get connection(): IConnection {
    return this._connection;
  }
  set connection(connection: IConnection) {
    this._connection = connection;
  }

  async handleInitializeRequest(
    params: InitializeParams,
    _token?: CancellationToken,
    configDir?: string,
  ): Promise<InitializeResult> {
    if (!params) {
      throw new Error('`params` argument is required to initialize.');
    }

    const serverCapabilities: InitializeResult = {
      capabilities: {
        workspaceSymbolProvider: true,
        documentSymbolProvider: true,
        completionProvider: {
          resolveProvider: true,
          triggerCharacters: ['@'],
        },
        definitionProvider: true,
        textDocumentSync: 1,
        hoverProvider: true,
        workspace: {
          workspaceFolders: {
            supported: true,
            changeNotifications: true,
          },
        },
      },
    };

    this._rootPath = configDir
      ? configDir.trim()
      : params.rootPath || this._rootPath;
    if (!this._rootPath) {
      this._logger.warn(
        'no rootPath configured in extension or server, defaulting to cwd',
      );
    }
    this._loadConfigOptions.rootDir = this._rootPath;

    this._graphQLCache = await getGraphQLCache({
      parser: this._parser,
      loadConfigOptions: this._loadConfigOptions,
      config: this._graphQLConfig,
    });
    this._languageService = new GraphQLLanguageService(this._graphQLCache);

    if (!serverCapabilities) {
      throw new Error('GraphQL Language Server is not initialized.');
    }

    this._isInitialized = true;

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'initialize',
      }),
    );
    const config = this._graphQLCache.getGraphQLConfig();
    await this._cacheAllProjectFiles(config);

    return serverCapabilities;
  }

  async handleDidOpenOrSaveNotification(
    params: DidSaveTextDocumentParams | DidOpenTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    if (!this._isInitialized || !this._graphQLCache) {
      return null;
    }

    const settings = await this._connection.workspace.getConfiguration({
      section: 'graphql-config',
    });
    if (settings.rootDir && settings.rootDir !== this._rootPath) {
      this._rootPath = settings.rootDir;
      this._loadConfigOptions.rootDir = settings.rootDir;

      this._graphQLCache = await getGraphQLCache({
        parser: this._parser,
        loadConfigOptions: this._loadConfigOptions,
        config: this._graphQLConfig,
      });
      this._languageService = new GraphQLLanguageService(this._graphQLCache);
    }

    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }
    const { textDocument } = params;
    const { uri } = textDocument;

    const diagnostics: Diagnostic[] = [];

    let contents: CachedContent[] = [];

    // Create/modify the cached entry if text is provided.
    // Otherwise, try searching the cache to perform diagnostics.
    if ('text' in textDocument && textDocument.text) {
      // textDocument/didSave does not pass in the text content.
      // Only run the below function if text is passed in.
      contents = this._parser(textDocument.text, uri);

      await this._invalidateCache(textDocument, uri, contents);
    } else {
      const cachedDocument = this._getCachedDocument(textDocument.uri);
      if (cachedDocument) {
        contents = cachedDocument.contents;
      }
    }

    await Promise.all(
      contents.map(async ({ query, range }) => {
        const results = await this._languageService.getDiagnostics(
          query,
          uri,
          this._isRelayCompatMode(query) ? false : true,
        );
        if (results && results.length > 0) {
          diagnostics.push(...processDiagnosticsMessage(results, query, range));
        }
      }),
    );

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didOpen',
        projectName: project && project.name,
        fileName: uri,
      }),
    );

    return { uri, diagnostics };
  }

  async handleDidChangeNotification(
    params: DidChangeTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    if (!this._isInitialized || !this._graphQLCache) {
      return null;
    }
    // For every `textDocument/didChange` event, keep a cache of textDocuments
    // with version information up-to-date, so that the textDocument contents
    // may be used during performing language service features,
    // e.g. autocompletions.
    if (
      !params ||
      !params.textDocument ||
      !params.contentChanges ||
      !params.textDocument.uri
    ) {
      throw new Error(
        '`textDocument`, `textDocument.uri`, and `contentChanges` arguments are required.',
      );
    }

    const textDocument = params.textDocument;
    const contentChanges = params.contentChanges;
    const contentChange = contentChanges[contentChanges.length - 1];

    // As `contentChanges` is an array and we just want the
    // latest update to the text, grab the last entry from the array.
    const uri = textDocument.uri;

    // If it's a .js file, try parsing the contents to see if GraphQL queries
    // exist. If not found, delete from the cache.
    const contents = this._parser(contentChange.text, uri);
    // If it's a .graphql file, proceed normally and invalidate the cache.
    await this._invalidateCache(textDocument, uri, contents);

    const cachedDocument = this._getCachedDocument(uri);
    if (!cachedDocument) {
      return null;
    }

    await this._updateFragmentDefinition(uri, contents);
    await this._updateObjectTypeDefinition(uri, contents);

    // Send the diagnostics onChange as well
    const diagnostics: Diagnostic[] = [];
    await Promise.all(
      contents.map(async ({ query, range }) => {
        const results = await this._languageService.getDiagnostics(query, uri);
        if (results && results.length > 0) {
          diagnostics.push(...processDiagnosticsMessage(results, query, range));
        }
      }),
    );

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didChange',
        projectName: project && project.name,
        fileName: uri,
      }),
    );

    return { uri, diagnostics };
  }

  handleDidCloseNotification(params: DidCloseTextDocumentParams): void {
    if (!this._isInitialized || !this._graphQLCache) {
      return;
    }
    // For every `textDocument/didClose` event, delete the cached entry.
    // This is to keep a low memory usage && switch the source of truth to
    // the file on disk.
    if (!params || !params.textDocument) {
      throw new Error('`textDocument` is required.');
    }
    const textDocument = params.textDocument;
    const uri = textDocument.uri;

    if (this._textDocumentCache.has(uri)) {
      this._textDocumentCache.delete(uri);
    }

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didClose',
        projectName: project && project.name,
        fileName: uri,
      }),
    );
  }

  handleShutdownRequest(): void {
    this._willShutdown = true;
    return;
  }

  handleExitNotification(): void {
    process.exit(this._willShutdown ? 0 : 1);
  }

  validateDocumentAndPosition(params: CompletionParams): void {
    if (
      !params ||
      !params.textDocument ||
      !params.textDocument.uri ||
      !params.position
    ) {
      throw new Error(
        '`textDocument`, `textDocument.uri`, and `position` arguments are required.',
      );
    }
  }

  async handleCompletionRequest(
    params: CompletionParams,
  ): Promise<CompletionList | Array<CompletionItem>> {
    if (!this._isInitialized || !this._graphQLCache) {
      return [];
    }

    this.validateDocumentAndPosition(params);

    const textDocument = params.textDocument;
    const position = params.position;

    // `textDocument/completion` event takes advantage of the fact that
    // `textDocument/didChange` event always fires before, which would have
    // updated the cache with the query text from the editor.
    // Treat the computed list always complete.

    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      throw new Error('A cached document cannot be found.');
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange && currentRange.containsPosition(position)) {
        return true;
      }
    });

    // If there is no GraphQL query in this file, return an empty result.
    if (!found) {
      return [];
    }

    const { query, range } = found;

    if (range) {
      position.line -= range.start.line;
    }
    const result = await this._languageService.getAutocompleteSuggestions(
      query,
      position,
      textDocument.uri,
    );

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(textDocument.uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/completion',
        projectName: project && project.name,
        fileName: textDocument.uri,
      }),
    );

    return { items: result, isIncomplete: false };
  }

  async handleHoverRequest(params: TextDocumentPositionParams): Promise<Hover> {
    if (!this._isInitialized || !this._graphQLCache) {
      return { contents: [] };
    }

    this.validateDocumentAndPosition(params);

    const textDocument = params.textDocument;
    const position = params.position;

    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      throw new Error('A cached document cannot be found.');
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange && currentRange.containsPosition(position)) {
        return true;
      }
    });

    // If there is no GraphQL query in this file, return an empty result.
    if (!found) {
      return { contents: [] };
    }

    const { query, range } = found;

    if (range) {
      position.line -= range.start.line;
    }
    const result = await this._languageService.getHoverInformation(
      query,
      position,
      textDocument.uri,
    );

    return {
      contents: result,
    };
  }

  async handleWatchedFilesChangedNotification(
    params: DidChangeWatchedFilesParams,
  ): Promise<Array<PublishDiagnosticsParams | undefined> | null> {
    if (!this._isInitialized || !this._graphQLCache) {
      return null;
    }

    return Promise.all(
      params.changes.map(async (change: FileEvent) => {
        if (!this._isInitialized || !this._graphQLCache) {
          throw Error('No cache available for handleWatchedFilesChanged');
        }

        if (
          change.type === FileChangeTypeKind.Created ||
          change.type === FileChangeTypeKind.Changed
        ) {
          const uri = change.uri;
          const text: string = readFileSync(new URL(uri).pathname).toString();
          const contents = this._parser(text, uri);

          await this._updateFragmentDefinition(uri, contents);
          await this._updateObjectTypeDefinition(uri, contents);

          const diagnostics = (
            await Promise.all(
              contents.map(async ({ query, range }) => {
                const results = await this._languageService.getDiagnostics(
                  query,
                  uri,
                );
                if (results && results.length > 0) {
                  return processDiagnosticsMessage(results, query, range);
                } else {
                  return [];
                }
              }),
            )
          ).reduce((left, right) => left.concat(right), []);

          const project = this._graphQLCache
            .getGraphQLConfig()
            .getProjectForFile(uri);

          this._logger.log(
            JSON.stringify({
              type: 'usage',
              messageType: 'workspace/didChangeWatchedFiles',
              projectName: project && project.name,
              fileName: uri,
            }),
          );

          return { uri, diagnostics };
        } else if (change.type === FileChangeTypeKind.Deleted) {
          this._graphQLCache.updateFragmentDefinitionCache(
            this._graphQLCache.getGraphQLConfig().dirpath,
            change.uri,
            false,
          );
          this._graphQLCache.updateObjectTypeDefinitionCache(
            this._graphQLCache.getGraphQLConfig().dirpath,
            change.uri,
            false,
          );
        }
      }),
    );
  }

  async handleDefinitionRequest(
    params: TextDocumentPositionParams,
    _token?: CancellationToken,
  ): Promise<Array<Location>> {
    if (!this._isInitialized || !this._graphQLCache) {
      return [];
    }

    if (!params || !params.textDocument || !params.position) {
      throw new Error('`textDocument` and `position` arguments are required.');
    }
    const textDocument = params.textDocument;
    const position = params.position;
    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(textDocument.uri);
    if (project) {
      await this._cacheSchemaFilesForProject(project);
    }
    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      return [];
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange && currentRange.containsPosition(position)) {
        return true;
      }
    });

    // If there is no GraphQL query in this file, return an empty result.
    if (!found) {
      return [];
    }

    const { query, range: parentRange } = found;
    if (parentRange) {
      position.line -= parentRange.start.line;
    }

    const result = await this._languageService.getDefinition(
      query,
      position,
      textDocument.uri,
    );

    const inlineFragments: string[] = [];

    visit(
      parse(query, {
        allowLegacySDLEmptyFields: true,
        allowLegacySDLImplementsInterfaces: true,
      }),
      {
        FragmentDefinition: (node: FragmentDefinitionNode) => {
          inlineFragments.push(node.name.value);
        },
      },
    );

    const formatted = result
      ? result.definitions.map(res => {
          const defRange = res.range as Range;

          if (parentRange && res.name) {
            const isInline = inlineFragments.includes(res.name);
            const isEmbedded = DEFAULT_SUPPORTED_EXTENSIONS.includes(
              path.extname(textDocument.uri),
            );
            if (isInline && isEmbedded) {
              const vOffset = parentRange.start.line;
              defRange.setStart(
                (defRange.start.line += vOffset),
                defRange.start.character,
              );
              defRange.setEnd(
                (defRange.end.line += vOffset),
                defRange.end.character,
              );
            }
          }

          return {
            // TODO: fix this hack!
            // URI is being misused all over this library - there's a link that
            // defines how an URI should be structured:
            // https://tools.ietf.org/html/rfc3986
            // Remove the below hack once the usage of URI is sorted out in related
            // libraries.
            uri:
              res.path.indexOf('file:///') === 0
                ? res.path
                : `file://${path.resolve(res.path)}`,
            range: defRange,
          } as Location;
        })
      : [];

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/definition',
        projectName: project && project.name,
        fileName: textDocument.uri,
      }),
    );
    return formatted;
  }

  async handleDocumentSymbolRequest(
    params: DocumentSymbolParams,
  ): Promise<Array<SymbolInformation>> {
    if (!this._isInitialized) {
      return [];
    }

    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }

    const textDocument = params.textDocument;
    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument || !cachedDocument.contents[0]) {
      throw new Error('A cached document cannot be found.');
    }
    return this._languageService.getDocumentSymbols(
      cachedDocument.contents[0].query,
      textDocument.uri,
    );
  }

  // async handleReferencesRequest(params: ReferenceParams): Promise<Location[]> {
  //    if (!this._isInitialized) {
  //      return [];
  //    }

  //    if (!params || !params.textDocument) {
  //      throw new Error('`textDocument` argument is required.');
  //    }

  //    const textDocument = params.textDocument;
  //    const cachedDocument = this._getCachedDocument(textDocument.uri);
  //    if (!cachedDocument) {
  //      throw new Error('A cached document cannot be found.');
  //    }
  //    return this._languageService.getReferences(
  //      cachedDocument.contents[0].query,
  //      params.position,
  //      textDocument.uri,
  //    );
  // }

  async handleWorkspaceSymbolRequest(
    params: WorkspaceSymbolParams,
  ): Promise<Array<SymbolInformation>> {
    // const config = await this._graphQLCache.getGraphQLConfig();
    // await this._cacheAllProjectFiles(config);

    if (params.query !== '') {
      const documents = this._getTextDocuments();
      const symbols: SymbolInformation[] = [];
      await Promise.all(
        documents.map(async ([uri]) => {
          const cachedDocument = this._getCachedDocument(uri);
          if (!cachedDocument) {
            console.error('A cached document cannot be found.');
            return [];
          }
          const docSymbols = await this._languageService.getDocumentSymbols(
            cachedDocument.contents[0].query,
            uri,
          );
          symbols.push(...docSymbols);
        }),
      );
      return symbols.filter(
        symbol => symbol?.name && symbol.name.includes(params.query),
      );
    }

    return [];
  }

  _getTextDocuments() {
    return Array.from(this._textDocumentCache);
  }

  async _cacheSchemaText(uri: string, text: string, version: number) {
    try {
      const contents = this._parser(text, uri);
      if (contents.length > 0) {
        await this._invalidateCache({ version, uri }, uri, contents);
        await this._updateObjectTypeDefinition(uri, contents);
      }
    } catch (err) {
      this._logger.error(err);
    }
  }
  async _cacheSchemaFile(
    uri: UnnormalizedTypeDefPointer,
    project: GraphQLProjectConfig,
  ) {
    uri = uri.toString();

    const isFileUri = existsSync(uri);

    let version = 1;
    if (isFileUri) {
      const schemaUri = 'file://' + path.join(project.dirpath, uri);
      const schemaDocument = this._getCachedDocument(schemaUri);

      if (schemaDocument) {
        version = schemaDocument.version++;
      }
      const schemaText = readFileSync(uri, { encoding: 'utf-8' });
      this._cacheSchemaText(schemaUri, schemaText, version);
    }
  }
  _getTmpProjectPath(
    project: GraphQLProjectConfig,
    prependWithProtocol: boolean = true,
    appendPath?: string,
  ) {
    const baseDir = this._graphQLCache.getGraphQLConfig().dirpath;
    const workspaceName = path.basename(baseDir);
    const basePath = path.join(this._tmpDirBase, workspaceName);
    let projectTmpPath = path.join(basePath, 'projects', project.name);
    if (!existsSync(projectTmpPath)) {
      mkdirp(projectTmpPath);
    }
    if (appendPath) {
      projectTmpPath = path.join(projectTmpPath, appendPath);
    }
    if (prependWithProtocol) {
      return `file://${path.resolve(projectTmpPath)}`;
    } else {
      return path.resolve(projectTmpPath);
    }
  }
  async _cacheSchemaFilesForProject(project: GraphQLProjectConfig) {
    const schema = project?.schema;
    const config = project?.extensions?.vscode;
    /**
     * By default, let's only cache the full graphql config schema.
     * This allows us to rely on graphql-config's schema building features
     * And our own cache implementations
     * This prefers schema instead of SDL first schema development, but will still
     * work with lookup of the actual .graphql schema files if the option is enabled,
     * however results may vary.
     *
     * The default temporary schema file seems preferrable until we have graphql source maps
     */
    const cacheSchemaFiles = config?.cacheSchemaFiles || false;
    const cacheConfigSchema = config?.cacheConfigSchema || true;

    if (cacheConfigSchema) {
      await this._cacheConfigSchema(project);
    }
    if (cacheSchemaFiles && schema) {
      if (Array.isArray(schema)) {
        Promise.all(
          schema.map(async (uri: UnnormalizedTypeDefPointer) => {
            await this._cacheSchemaFile(uri, project);
          }),
        );
      } else {
        const uri = schema.toString();
        await this._cacheSchemaFile(uri, project);
      }
    }
  }
  /**
   * Cache the schema as represented by graphql-config, with extensions
   * from GraphQLCache.getSchema()
   * @param project {GraphQLProjectConfig}
   */
  async _cacheConfigSchema(project: GraphQLProjectConfig) {
    try {
      const schema = await this._graphQLCache.getSchema(project.name);
      if (schema) {
        let schemaText = printSchema(schema, {
          commentDescriptions: true,
        });
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

        const cachedSchemaDoc = this._getCachedDocument(uri);

        if (!cachedSchemaDoc) {
          await writeFileAsync(fsPath, schemaText, {
            encoding: 'utf-8',
          });
          await this._cacheSchemaText(uri, schemaText, 1);
        }
        // do we have a change in the getSchema result? if so, update schema cache
        if (cachedSchemaDoc) {
          writeFileSync(fsPath, schemaText, {
            encoding: 'utf-8',
          });
          await this._cacheSchemaText(
            uri,
            schemaText,
            cachedSchemaDoc.version++,
          );
        }
      }
    } catch (err) {
      this._logger.error(err);
    }
  }
  /**
   * Pre-cache all documents for a project.
   *
   * TODO: Maybe make this optional, where only schema needs to be pre-cached.
   *
   * @param project {GraphQLProjectConfig}
   */
  async _cacheDocumentFilesforProject(project: GraphQLProjectConfig) {
    try {
      const documents = await project.getDocuments();
      return Promise.all(
        documents.map(async document => {
          if (!document.location || !document.rawSDL) {
            return;
          }
          // build full system URI path with protocol
          const uri = 'file://' + path.join(project.dirpath, document.location);
          // i would use the already existing graphql-config AST, but there are a few reasons we can't yet
          const contents = this._parser(document.rawSDL, uri);
          if (!contents[0] || !contents[0].query) {
            return;
          }
          await this._updateObjectTypeDefinition(uri, contents);
          await this._updateFragmentDefinition(uri, contents);
          await this._invalidateCache({ version: 1, uri }, uri, contents);
        }),
      );
    } catch (err) {
      this._logger.error(
        `invalid/unknown file in graphql config documents entry:\n '${project.documents}'`,
      );
      this._logger.error(err);
    }
  }
  /**
   * This should only be run on initialize() really.
   * Cacheing all the document files upfront could be expensive.
   * @param config {GraphQLConfig}
   */
  async _cacheAllProjectFiles(config: GraphQLConfig) {
    if (config?.projects) {
      return Promise.all(
        Object.keys(config.projects).map(async projectName => {
          const project = await config.getProject(projectName);
          await this._cacheSchemaFilesForProject(project);
          await this._cacheDocumentFilesforProject(project);
        }),
      );
    }
  }
  _isRelayCompatMode(query: string): boolean {
    return (
      query.indexOf('RelayCompat') !== -1 ||
      query.indexOf('react-relay/compat') !== -1
    );
  }

  async _updateFragmentDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const rootDir = this._graphQLCache.getGraphQLConfig().dirpath;

    await this._graphQLCache.updateFragmentDefinition(
      rootDir,
      new URL(uri).pathname,
      contents,
    );
  }

  async _updateObjectTypeDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const rootDir = this._graphQLCache.getGraphQLConfig().dirpath;

    await this._graphQLCache.updateObjectTypeDefinition(
      rootDir,
      new URL(uri).pathname,
      contents,
    );
  }

  _getCachedDocument(uri: string): CachedDocumentType | null {
    if (this._textDocumentCache.has(uri)) {
      const cachedDocument = this._textDocumentCache.get(uri);
      if (cachedDocument) {
        return cachedDocument;
      }
    }

    return null;
  }
  async _invalidateCache(
    textDocument: VersionedTextDocumentIdentifier,
    uri: Uri,
    contents: CachedContent[],
  ): Promise<Map<string, CachedDocumentType> | null> {
    if (this._textDocumentCache.has(uri)) {
      const cachedDocument = this._textDocumentCache.get(uri);
      if (
        cachedDocument &&
        textDocument &&
        textDocument?.version &&
        cachedDocument.version < textDocument.version
      ) {
        // Current server capabilities specify the full sync of the contents.
        // Therefore always overwrite the entire content.
        return this._textDocumentCache.set(uri, {
          version: textDocument.version,
          contents,
        });
      }
    } else if (textDocument?.version) {
      return this._textDocumentCache.set(uri, {
        version: textDocument.version,
        contents,
      });
    }
    return null;
  }
}

function processDiagnosticsMessage(
  results: Diagnostic[],
  query: string,
  range: RangeType | null,
): Diagnostic[] {
  const queryLines = query.split('\n');
  const totalLines = queryLines.length;
  const lastLineLength = queryLines[totalLines - 1].length;
  const lastCharacterPosition = new Position(totalLines, lastLineLength);
  const processedResults = results.filter(diagnostic =>
    // @ts-ignore
    diagnostic.range.end.lessThanOrEqualTo(lastCharacterPosition),
  );

  if (range) {
    const offset = range.start;
    return processedResults.map(diagnostic => ({
      ...diagnostic,
      range: new Range(
        new Position(
          diagnostic.range.start.line + offset.line,
          diagnostic.range.start.character,
        ),
        new Position(
          diagnostic.range.end.line + offset.line,
          diagnostic.range.end.character,
        ),
      ),
    }));
  }

  return processedResults;
}
