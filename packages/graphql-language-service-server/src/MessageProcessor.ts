/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import mkdirp from 'mkdirp';
import { readFileSync, existsSync, writeFileSync, writeFile } from 'fs';
import * as path from 'path';
import glob from 'fast-glob';
import { URI } from 'vscode-uri';
import {
  CachedContent,
  Uri,
  GraphQLConfig,
  GraphQLProjectConfig,
  FileChangeTypeKind,
  Range,
  Position,
  IPosition,
} from 'graphql-language-service';

import { GraphQLLanguageService } from './GraphQLLanguageService';

import type {
  CompletionParams,
  FileEvent,
  VersionedTextDocumentIdentifier,
  DidSaveTextDocumentParams,
  DidOpenTextDocumentParams,
  DidChangeConfigurationParams,
} from 'vscode-languageserver/node';

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
  Position as VscodePosition,
  TextDocumentPositionParams,
  DocumentSymbolParams,
  SymbolInformation,
  WorkspaceSymbolParams,
  Connection,
  DidChangeConfigurationRegistrationOptions,
} from 'vscode-languageserver/node';

import type { UnnormalizedTypeDefPointer } from '@graphql-tools/load';

import { getGraphQLCache, GraphQLCache } from './GraphQLCache';
import { parseDocument, DEFAULT_SUPPORTED_EXTENSIONS } from './parseDocument';

import { Logger } from './Logger';
import { printSchema, visit, parse, FragmentDefinitionNode } from 'graphql';
import { tmpdir } from 'os';
import {
  ConfigEmptyError,
  ConfigInvalidError,
  ConfigNotFoundError,
  GraphQLExtensionDeclaration,
  LoaderNoResultError,
  ProjectNotFoundError,
} from 'graphql-config';
import type { LoadConfigOptions } from './types';
import { promisify } from 'util';

const writeFileAsync = promisify(writeFile);

const configDocLink =
  'https://www.npmjs.com/package/graphql-language-service-server#user-content-graphql-configuration-file';

type CachedDocumentType = {
  version: number;
  contents: CachedContent[];
};
function toPosition(position: VscodePosition): IPosition {
  return new Position(position.line, position.character);
}

export class MessageProcessor {
  _connection: Connection;
  _graphQLCache!: GraphQLCache;
  _graphQLConfig: GraphQLConfig | undefined;
  _languageService!: GraphQLLanguageService;
  _textDocumentCache: Map<string, CachedDocumentType>;
  _isInitialized: boolean;
  _isGraphQLConfigMissing: boolean | null = null;
  _willShutdown: boolean;
  _logger: Logger;
  _extensions?: GraphQLExtensionDeclaration[];
  _parser: (text: string, uri: string) => CachedContent[];
  _tmpDir: string;
  _tmpUriBase: string;
  _tmpDirBase: string;
  _loadConfigOptions: LoadConfigOptions;
  _schemaCacheInit = false;
  _rootPath: string = process.cwd();
  _settings: any;

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
    connection: Connection;
  }) {
    this._connection = connection;
    this._textDocumentCache = new Map();
    this._isInitialized = false;
    this._willShutdown = false;
    this._logger = logger;
    this._graphQLConfig = config;
    this._parser = (text, uri) => {
      const p = parser ?? parseDocument;
      return p(text, uri, fileExtensions, graphqlFileExtensions, this._logger);
    };
    this._tmpDir = tmpDir || tmpdir();
    this._tmpDirBase = path.join(this._tmpDir, 'graphql-language-service');
    this._tmpUriBase = URI.file(this._tmpDirBase).toString();
    // use legacy mode by default for backwards compatibility
    this._loadConfigOptions = { legacy: true, ...loadConfigOptions };
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
  get connection(): Connection {
    return this._connection;
  }
  set connection(connection: Connection) {
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
          triggerCharacters: [' ', ':', '$', '(', '@'],
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
      : params.rootUri || this._rootPath;
    if (!this._rootPath) {
      this._logger.warn(
        'no rootPath configured in extension or server, defaulting to cwd',
      );
    }
    if (!serverCapabilities) {
      throw new Error('GraphQL Language Server is not initialized.');
    }

    this._logger.info(
      JSON.stringify({
        type: 'usage',
        messageType: 'initialize',
      }),
    );

    return serverCapabilities;
  }

  async _updateGraphQLConfig() {
    const settings = await this._connection.workspace.getConfiguration({
      section: 'graphql-config',
    });
    const vscodeSettings = await this._connection.workspace.getConfiguration({
      section: 'vscode-graphql',
    });
    if (settings?.dotEnvPath) {
      require('dotenv').config({ path: settings.dotEnvPath });
    }
    this._settings = { ...settings, ...vscodeSettings };
    const rootDir = this._settings?.load?.rootDir || this._rootPath;
    this._rootPath = rootDir;
    this._loadConfigOptions = {
      ...Object.keys(this._settings?.load ?? {}).reduce((agg, key) => {
        const value = this._settings?.load[key];
        if (value === undefined || value === null) {
          delete agg[key];
        }
        return agg;
      }, this._settings.load ?? {}),
      rootDir,
    };
    try {
      // reload the graphql cache
      this._graphQLCache = await getGraphQLCache({
        parser: this._parser,
        loadConfigOptions: this._loadConfigOptions,

        logger: this._logger,
      });
      this._languageService = new GraphQLLanguageService(
        this._graphQLCache,
        this._logger,
      );
      if (this._graphQLConfig || this._graphQLCache?.getGraphQLConfig) {
        const config =
          this._graphQLConfig ?? this._graphQLCache.getGraphQLConfig();
        await this._cacheAllProjectFiles(config);
      }
      this._isInitialized = true;
    } catch (err) {
      this._handleConfigError({ err });
    }
  }
  _handleConfigError({ err }: { err: unknown; uri?: string }) {
    if (err instanceof ConfigNotFoundError) {
      // TODO: obviously this needs to become a map by workspace from uri
      // for workspaces support
      this._isGraphQLConfigMissing = true;

      this._logConfigError(err.message);
    } else if (err instanceof ProjectNotFoundError) {
      // this is the only case where we don't invalidate config;
      // TODO: per-project schema initialization status (PR is almost ready)
      this._logConfigError(
        'Project not found for this file - make sure that a schema is present',
      );
    } else if (err instanceof ConfigInvalidError) {
      this._isGraphQLConfigMissing = true;
      this._logConfigError(`Invalid configuration\n${err.message}`);
    } else if (err instanceof ConfigEmptyError) {
      this._isGraphQLConfigMissing = true;
      this._logConfigError(err.message);
    } else if (err instanceof LoaderNoResultError) {
      this._isGraphQLConfigMissing = true;
      this._logConfigError(err.message);
      return;
    } else {
      // if it's another kind of error,
      // lets just assume the config is missing and
      // disable language features
      this._isGraphQLConfigMissing = true;
      this._logConfigError(
        // @ts-expect-error
        err?.message ?? err?.toString(),
      );
    }
  }

  _logConfigError(errorMessage: string) {
    this._logger.error(
      `WARNING: graphql-config error, only highlighting is enabled:\n` +
        errorMessage +
        `\nfor more information on using 'graphql-config' with 'graphql-language-service-server', \nsee the documentation at ${configDocLink}`,
    );
  }

  async handleDidOpenOrSaveNotification(
    params: DidSaveTextDocumentParams | DidOpenTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    /**
     * Initialize the LSP server when the first file is opened or saved,
     * so that we can access the user settings for config rootDir, etc
     */
    try {
      if (!this._isInitialized || !this._graphQLCache) {
        // don't try to initialize again if we've already tried
        // and the graphql config file or package.json entry isn't even there
        if (this._isGraphQLConfigMissing === true) {
          return null;
        }
        // then initial call to update graphql config
        await this._updateGraphQLConfig();
      }
    } catch (err) {
      this._logger.error(String(err));
    }

    // Here, we set the workspace settings in memory,
    // and re-initialize the language service when a different
    // root path is detected.
    // We aren't able to use initialization event for this
    // and the config change event is after the fact.

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
      const configMatchers = [
        'graphql.config',
        'graphqlrc',
        'graphqlconfig',
      ].filter(Boolean);
      if (this._settings?.load?.fileName) {
        configMatchers.push(this._settings.load.fileName);
      }

      const hasGraphQLConfigFile = configMatchers.some(
        v => uri.match(v)?.length,
      );
      const hasPackageGraphQLConfig =
        uri.match('package.json')?.length && require(uri)?.graphql;
      if (hasGraphQLConfigFile || hasPackageGraphQLConfig) {
        this._logger.info('updating graphql config');
        this._updateGraphQLConfig();
        return { uri, diagnostics: [] };
      }
      // update graphql config only when graphql config is saved!
      const cachedDocument = this._getCachedDocument(textDocument.uri);
      if (cachedDocument) {
        contents = cachedDocument.contents;
      }
      return null;
    }
    if (!this._graphQLCache) {
      return { uri, diagnostics };
    }
    try {
      const project = this._graphQLCache.getProjectForFile(uri);
      if (
        this._isInitialized &&
        project?.extensions?.languageService?.enableValidation !== false
      ) {
        await Promise.all(
          contents.map(async ({ query, range }) => {
            const results = await this._languageService.getDiagnostics(
              query,
              uri,
              this._isRelayCompatMode(query),
            );
            if (results && results.length > 0) {
              diagnostics.push(
                ...processDiagnosticsMessage(results, query, range),
              );
            }
          }),
        );
      }

      this._logger.log(
        JSON.stringify({
          type: 'usage',
          messageType: 'textDocument/didOpenOrSave',
          projectName: project?.name,
          fileName: uri,
        }),
      );
    } catch (err) {
      this._handleConfigError({ err, uri });
    }

    return { uri, diagnostics };
  }

  async handleDidChangeNotification(
    params: DidChangeTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    if (
      this._isGraphQLConfigMissing ||
      !this._isInitialized ||
      !this._graphQLCache
    ) {
      return null;
    }
    // For every `textDocument/didChange` event, keep a cache of textDocuments
    // with version information up-to-date, so that the textDocument contents
    // may be used during performing language service features,
    // e.g. auto-completions.
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
    const uri = textDocument.uri;
    const project = this._graphQLCache.getProjectForFile(uri);
    try {
      const contentChanges = params.contentChanges;
      const contentChange = contentChanges[contentChanges.length - 1];

      // As `contentChanges` is an array and we just want the
      // latest update to the text, grab the last entry from the array.

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

      const diagnostics: Diagnostic[] = [];

      if (project?.extensions?.languageService?.enableValidation !== false) {
        // Send the diagnostics onChange as well
        await Promise.all(
          contents.map(async ({ query, range }) => {
            const results = await this._languageService.getDiagnostics(
              query,
              uri,
              this._isRelayCompatMode(query),
            );
            if (results && results.length > 0) {
              diagnostics.push(
                ...processDiagnosticsMessage(results, query, range),
              );
            }
          }),
        );
      }

      this._logger.log(
        JSON.stringify({
          type: 'usage',
          messageType: 'textDocument/didChange',
          projectName: project?.name,
          fileName: uri,
        }),
      );

      return { uri, diagnostics };
    } catch (err) {
      this._handleConfigError({ err, uri });
      return { uri, diagnostics: [] };
    }
  }
  async handleDidChangeConfiguration(
    _params: DidChangeConfigurationParams,
  ): Promise<DidChangeConfigurationRegistrationOptions> {
    await this._updateGraphQLConfig();
    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'workspace/didChangeConfiguration',
      }),
    );
    return {};
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
    const project = this._graphQLCache.getProjectForFile(uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didClose',
        projectName: project?.name,
        fileName: uri,
      }),
    );
  }

  handleShutdownRequest(): void {
    this._willShutdown = true;
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
      return [];
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange?.containsPosition(toPosition(position))) {
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
      toPosition(position),
      textDocument.uri,
    );

    const project = this._graphQLCache.getProjectForFile(textDocument.uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/completion',
        projectName: project?.name,
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
      return { contents: [] };
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange?.containsPosition(toPosition(position))) {
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
      toPosition(position),
      textDocument.uri,
      { useMarkdown: true },
    );

    return {
      contents: result,
    };
  }

  async handleWatchedFilesChangedNotification(
    params: DidChangeWatchedFilesParams,
  ): Promise<Array<PublishDiagnosticsParams | undefined> | null> {
    if (
      this._isGraphQLConfigMissing ||
      !this._isInitialized ||
      !this._graphQLCache
    ) {
      return null;
    }

    return Promise.all(
      params.changes.map(async (change: FileEvent) => {
        if (
          this._isGraphQLConfigMissing ||
          !this._isInitialized ||
          !this._graphQLCache
        ) {
          this._logger.warn('No cache available for handleWatchedFilesChanged');
          return;
        }
        if (
          change.type === FileChangeTypeKind.Created ||
          change.type === FileChangeTypeKind.Changed
        ) {
          const uri = change.uri;

          const text = readFileSync(URI.parse(uri).fsPath, 'utf-8');
          const contents = this._parser(text, uri);

          await this._updateFragmentDefinition(uri, contents);
          await this._updateObjectTypeDefinition(uri, contents);

          const project = this._graphQLCache.getProjectForFile(uri);
          let diagnostics: Diagnostic[] = [];

          if (
            project?.extensions?.languageService?.enableValidation !== false
          ) {
            diagnostics = (
              await Promise.all(
                contents.map(async ({ query, range }) => {
                  const results = await this._languageService.getDiagnostics(
                    query,
                    uri,
                    this._isRelayCompatMode(query),
                  );
                  if (results && results.length > 0) {
                    return processDiagnosticsMessage(results, query, range);
                  }
                  return [];
                }),
              )
            ).reduce((left, right) => left.concat(right), diagnostics);
          }

          this._logger.log(
            JSON.stringify({
              type: 'usage',
              messageType: 'workspace/didChangeWatchedFiles',
              projectName: project?.name,
              fileName: uri,
            }),
          );
          return { uri, diagnostics };
        }
        if (change.type === FileChangeTypeKind.Deleted) {
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
    const project = this._graphQLCache.getProjectForFile(textDocument.uri);
    if (project) {
      await this._cacheSchemaFilesForProject(project);
    }
    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      return [];
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange?.containsPosition(toPosition(position))) {
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

    let result = null;

    try {
      result = await this._languageService.getDefinition(
        query,
        toPosition(position),
        textDocument.uri,
      );
    } catch (err) {
      // these thrown errors end up getting fired before the service is initialized, so lets cool down on that
    }

    const inlineFragments: string[] = [];
    try {
      visit(parse(query), {
        FragmentDefinition: (node: FragmentDefinitionNode) => {
          inlineFragments.push(node.name.value);
        },
      });
    } catch {}

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
            uri: res.path,
            range: defRange,
          } as Location;
        })
      : [];

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/definition',
        projectName: project?.name,
        fileName: textDocument.uri,
      }),
    );
    return formatted;
  }

  async handleDocumentSymbolRequest(
    params: DocumentSymbolParams,
  ): Promise<Array<SymbolInformation>> {
    if (!this._isInitialized || !this._graphQLCache) {
      return [];
    }

    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }

    const textDocument = params.textDocument;
    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument || !cachedDocument.contents[0]) {
      return [];
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
    if (!this._isInitialized || !this._graphQLCache) {
      return [];
    }
    // const config = await this._graphQLCache.getGraphQLConfig();
    // await this._cacheAllProjectFiles(config);

    if (params.query !== '') {
      const documents = this._getTextDocuments();
      const symbols: SymbolInformation[] = [];
      await Promise.all(
        documents.map(async ([uri]) => {
          const cachedDocument = this._getCachedDocument(uri);
          if (!cachedDocument) {
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
      this._logger.error(String(err));
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
      const schemaUri = URI.file(path.join(project.dirpath, uri)).toString();
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
    prependWithProtocol = true,
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
      return URI.file(path.resolve(projectTmpPath)).toString();
    }
    return path.resolve(projectTmpPath);
  }
  /**
   * Safely attempts to cache schema files based on a glob or path
   * Exits without warning in several cases because these strings can be almost
   * anything!
   * @param uri
   * @param project
   */
  async _cacheSchemaPath(uri: string, project: GraphQLProjectConfig) {
    try {
      const files = await glob(uri);
      if (files && files.length > 0) {
        await Promise.all(
          files.map(uriPath => this._cacheSchemaFile(uriPath, project)),
        );
      } else {
        try {
          this._cacheSchemaFile(uri, project);
        } catch (err) {
          // this string may be an SDL string even, how do we even evaluate this?
        }
      }
    } catch (err) {}
  }
  async _cacheObjectSchema(
    pointer: { [key: string]: any },
    project: GraphQLProjectConfig,
  ) {
    await Promise.all(
      Object.keys(pointer).map(async schemaUri =>
        this._cacheSchemaPath(schemaUri, project),
      ),
    );
  }
  async _cacheArraySchema(
    pointers: UnnormalizedTypeDefPointer[],
    project: GraphQLProjectConfig,
  ) {
    await Promise.all(
      pointers.map(async schemaEntry => {
        if (typeof schemaEntry === 'string') {
          await this._cacheSchemaPath(schemaEntry, project);
        } else if (schemaEntry) {
          await this._cacheObjectSchema(schemaEntry, project);
        }
      }),
    );
  }

  async _cacheSchemaFilesForProject(project: GraphQLProjectConfig) {
    const schema = project?.schema;
    const config = project?.extensions?.languageService;
    /**
     * By default, we look for schema definitions in SDL files
     *
     * with the opt-in feature `cacheSchemaOutputFileForLookup` enabled,
     * the resultant `graphql-config` .getSchema() schema output will be cached
     * locally and available as a single file for definition lookup and peek
     *
     * this is helpful when your `graphql-config` `schema` input is:
     * - a remote or local URL
     * - compiled from graphql files and code sources
     * - otherwise where you don't have schema SDL in the codebase or don't want to use it for lookup
     *
     * it is disabled by default
     */
    const cacheSchemaFileForLookup =
      config?.cacheSchemaFileForLookup ??
      this?._settings?.cacheSchemaFileForLookup ??
      false;
    if (cacheSchemaFileForLookup) {
      await this._cacheConfigSchema(project);
    } else if (typeof schema === 'string') {
      await this._cacheSchemaPath(schema, project);
    } else if (Array.isArray(schema)) {
      await this._cacheArraySchema(schema, project);
    } else if (schema) {
      await this._cacheObjectSchema(schema, project);
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
      this._logger.error(String(err));
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

          let filePath = document.location;
          if (!path.isAbsolute(filePath)) {
            filePath = path.join(project.dirpath, document.location);
          }

          // build full system URI path with protocol
          const uri = URI.file(filePath).toString();

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
      this._logger.error(String(err));
    }
  }
  /**
   * This should only be run on initialize() really.
   * Caching all the document files upfront could be expensive.
   * @param config {GraphQLConfig}
   */
  async _cacheAllProjectFiles(config: GraphQLConfig) {
    if (config?.projects) {
      return Promise.all(
        Object.keys(config.projects).map(async projectName => {
          const project = config.getProject(projectName);
          await this._cacheSchemaFilesForProject(project);
          await this._cacheDocumentFilesforProject(project);
        }),
      );
    }
  }
  _isRelayCompatMode(query: string): boolean {
    return (
      query.includes('RelayCompat') || query.includes('react-relay/compat')
    );
  }

  async _updateFragmentDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const rootDir = this._graphQLCache.getGraphQLConfig().dirpath;

    await this._graphQLCache.updateFragmentDefinition(rootDir, uri, contents);
  }

  async _updateObjectTypeDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const rootDir = this._graphQLCache.getGraphQLConfig().dirpath;

    await this._graphQLCache.updateObjectTypeDefinition(rootDir, uri, contents);
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
    }
    return this._textDocumentCache.set(uri, {
      version: textDocument.version ?? 0,
      contents,
    });
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
