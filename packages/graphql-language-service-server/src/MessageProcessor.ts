/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
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
import { parseDocument } from './parseDocument';

import { printSchema, visit, parse, FragmentDefinitionNode } from 'graphql';
import { tmpdir } from 'node:os';
import {
  ConfigEmptyError,
  ConfigInvalidError,
  ConfigNotFoundError,
  GraphQLExtensionDeclaration,
  LoaderNoResultError,
  ProjectNotFoundError,
} from 'graphql-config';
import type { LoadConfigOptions } from './types';
import {
  DEFAULT_SUPPORTED_EXTENSIONS,
  SupportedExtensionsEnum,
} from './constants';
import { NoopLogger, Logger } from './Logger';
import glob from 'fast-glob';

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
  _textDocumentCache = new Map<string, CachedDocumentType>();
  _isInitialized = false;
  _isGraphQLConfigMissing: boolean | null = null;
  _willShutdown = false;
  _logger: Logger | NoopLogger;
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
    logger: Logger | NoopLogger;
    fileExtensions: ReadonlyArray<SupportedExtensionsEnum>;
    graphqlFileExtensions: string[];
    loadConfigOptions: LoadConfigOptions;
    config?: GraphQLConfig;
    parser?: typeof parseDocument;
    tmpDir?: string;
    connection: Connection;
  }) {
    this._connection = connection;
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
      void mkdirSync(this._tmpDirBase);
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
    const rootDir = this._settings?.load?.rootDir.length
      ? this._settings?.load?.rootDir
      : this._rootPath;
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
  private _handleConfigError({ err }: { err: unknown; uri?: string }) {
    // console.log(err, typeof err);
    if (err instanceof ConfigNotFoundError || err instanceof ConfigEmptyError) {
      // TODO: obviously this needs to become a map by workspace from uri
      // for workspaces support
      this._isGraphQLConfigMissing = true;
      this._logConfigError(err.message);
    } else if (err instanceof ProjectNotFoundError) {
      // this is the only case where we don't invalidate config;
      // TODO: per-project schema initialization status (PR is almost ready)
      this._logConfigError(
        'Project not found for this file - make sure that a schema is present in the config file or for the project',
      );
    } else if (err instanceof ConfigInvalidError) {
      this._isGraphQLConfigMissing = true;
      this._logConfigError(`Invalid configuration\n${err.message}`);
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

  private _logConfigError(errorMessage: string) {
    this._logger.error(
      'WARNING: graphql-config error, only highlighting is enabled:\n' +
        errorMessage +
        `\nfor more information on using 'graphql-config' with 'graphql-language-service-server', \nsee the documentation at ${configDocLink}`,
    );
  }
  private async _isGraphQLConfigFile(uri: string) {
    const configMatchers = ['graphql.config', 'graphqlrc', 'graphqlconfig'];
    if (this._settings?.load?.fileName?.length) {
      configMatchers.push(this._settings.load.fileName);
    }

    const fileMatch = configMatchers
      .filter(Boolean)
      .some(v => uri.match(v)?.length);
    if (fileMatch) {
      return fileMatch;
    }
    if (uri.match('package.json')?.length) {
      try {
        const pkgConfig = await readFile(URI.parse(uri).fsPath, 'utf-8');
        return Boolean(JSON.parse(pkgConfig)?.graphql);
      } catch {}
    }
    return false;
  }

  async handleDidOpenOrSaveNotification(
    params: DidSaveTextDocumentParams | DidOpenTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    /**
     * Initialize the LSP server when the first file is opened or saved,
     * so that we can access the user settings for config rootDir, etc
     */
    const isGraphQLConfigFile = await this._isGraphQLConfigFile(
      params.textDocument.uri,
    );
    try {
      if (!this._isInitialized) {
        // don't try to initialize again if we've already tried
        // and the graphql config file or package.json entry isn't even there
        if (this._isGraphQLConfigMissing === true && !isGraphQLConfigFile) {
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

    if (!params?.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }
    const { textDocument } = params;
    const { uri } = textDocument;

    const diagnostics: Diagnostic[] = [];

    let contents: CachedContent[] = [];
    const text = 'text' in textDocument && textDocument.text;
    // Create/modify the cached entry if text is provided.
    // Otherwise, try searching the cache to perform diagnostics.
    if (text) {
      // textDocument/didSave does not pass in the text content.
      // Only run the below function if text is passed in.
      contents = this._parser(text, uri);

      await this._invalidateCache(textDocument, uri, contents);
    } else {
      if (isGraphQLConfigFile) {
        this._logger.info('updating graphql config');
        await this._updateGraphQLConfig();
        return { uri, diagnostics: [] };
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
    if (!params?.textDocument?.uri || !params.contentChanges) {
      throw new Error(
        '`textDocument.uri` and `contentChanges` arguments are required.',
      );
    }
    const { textDocument, contentChanges } = params;
    const { uri } = textDocument;
    const project = this._graphQLCache.getProjectForFile(uri);
    try {
      const contentChange = contentChanges.at(-1)!;

      // As `contentChanges` is an array, and we just want the
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
    if (!this._isInitialized) {
      return;
    }
    // For every `textDocument/didClose` event, delete the cached entry.
    // This is to keep a low memory usage && switch the source of truth to
    // the file on disk.
    if (!params?.textDocument) {
      throw new Error('`textDocument` is required.');
    }
    const { textDocument } = params;
    const { uri } = textDocument;

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

  private validateDocumentAndPosition(params: CompletionParams): void {
    if (!params?.textDocument?.uri || !params.position) {
      throw new Error(
        '`textDocument.uri` and `position` arguments are required.',
      );
    }
  }

  async handleCompletionRequest(
    params: CompletionParams,
  ): Promise<CompletionList | Array<CompletionItem>> {
    if (!this._isInitialized) {
      return [];
    }

    this.validateDocumentAndPosition(params);

    const { textDocument, position } = params;

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
    if (!this._isInitialized) {
      return { contents: [] };
    }

    this.validateDocumentAndPosition(params);

    const { textDocument, position } = params;

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
          const { uri } = change;

          const text = await readFile(URI.parse(uri).fsPath, 'utf-8');
          const contents = this._parser(text, uri);
          await this._invalidateCache(
            { uri, version: 0 },
            URI.parse(uri).fsPath,
            contents,
          );
          await this._updateFragmentDefinition(uri, contents);
          await this._updateObjectTypeDefinition(uri, contents);

          try {
            const project = this._graphQLCache.getProjectForFile(uri);
            if (project) {
              await this._updateSchemaIfChanged(project, uri);
            }

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
          } catch (err) {
            this._handleConfigError({ err, uri });
            return { uri, diagnostics: [] };
          }
        }
        if (change.type === FileChangeTypeKind.Deleted) {
          await this._updateFragmentDefinition(change.uri, []);
          await this._updateObjectTypeDefinition(change.uri, []);
        }
      }),
    );
  }

  async handleDefinitionRequest(
    params: TextDocumentPositionParams,
    _token?: CancellationToken,
  ): Promise<Array<Location>> {
    if (!this._isInitialized) {
      return [];
    }

    if (!params?.textDocument || !params.position) {
      throw new Error('`textDocument` and `position` arguments are required.');
    }
    const { textDocument, position } = params;
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
    } catch {
      // these thrown errors end up getting fired before the service is initialized, so lets cool down on that
    }

    const inlineFragments: string[] = [];
    try {
      visit(parse(query), {
        FragmentDefinition(node: FragmentDefinitionNode) {
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
              path.extname(textDocument.uri) as SupportedExtensionsEnum,
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
    if (!this._isInitialized) {
      return [];
    }

    if (!params?.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }

    const { textDocument } = params;
    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument?.contents[0]) {
      return [];
    }

    if (
      this._settings.largeFileThreshold !== undefined &&
      this._settings.largeFileThreshold <
        cachedDocument.contents[0].query.length
    ) {
      return [];
    }

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/documentSymbol',
        fileName: textDocument.uri,
      }),
    );

    return this._languageService.getDocumentSymbols(
      cachedDocument.contents[0].query,
      textDocument.uri,
    );
  }

  // async handleReferencesRequest(params: ReferenceParams): Promise<Location[]> {
  //    if (!this._isInitialized) {
  //      return [];
  //    }

  //    if (!params?.textDocument) {
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
    if (!this._isInitialized) {
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

  private _getTextDocuments() {
    return Array.from(this._textDocumentCache);
  }

  private async _cacheSchemaText(uri: string, text: string, version: number) {
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
  private async _cacheSchemaFile(
    fileUri: UnnormalizedTypeDefPointer,
    project: GraphQLProjectConfig,
  ) {
    const uri = fileUri.toString();

    const isFileUri = existsSync(uri);
    let version = 1;
    if (isFileUri) {
      const schemaUri = URI.file(path.join(project.dirpath, uri)).toString();
      const schemaDocument = this._getCachedDocument(schemaUri);

      if (schemaDocument) {
        version = schemaDocument.version++;
      }
      const schemaText = readFileSync(uri, 'utf8');
      await this._cacheSchemaText(schemaUri, schemaText, version);
    }
  }
  private _getTmpProjectPath(
    project: GraphQLProjectConfig,
    prependWithProtocol = true,
    appendPath?: string,
  ) {
    const baseDir = this._graphQLCache.getGraphQLConfig().dirpath;
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

  private async _cacheSchemaFilesForProject(project: GraphQLProjectConfig) {
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
      true;
    const unwrappedSchema = this._unwrapProjectSchema(project);
    const sdlOnly = unwrappedSchema.every(
      schemaEntry =>
        schemaEntry.endsWith('.graphql') || schemaEntry.endsWith('.gql'),
    );
    // if we are caching the config schema, and it isn't a .graphql file, cache it
    if (cacheSchemaFileForLookup && !sdlOnly) {
      await this._cacheConfigSchema(project);
    } else if (sdlOnly) {
      await Promise.all(
        unwrappedSchema.map(async schemaEntry =>
          this._cacheSchemaFile(schemaEntry, project),
        ),
      );
    }
  }
  /**
   * Cache the schema as represented by graphql-config, with extensions
   * from GraphQLCache.getSchema()
   * @param project {GraphQLProjectConfig}
   */
  private async _cacheConfigSchema(project: GraphQLProjectConfig) {
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
          await writeFile(fsPath, schemaText, 'utf8');
          await this._cacheSchemaText(uri, schemaText, 1);
        }
        // do we have a change in the getSchema result? if so, update schema cache
        if (cachedSchemaDoc) {
          writeFileSync(fsPath, schemaText, 'utf8');
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
  private async _cacheDocumentFilesforProject(project: GraphQLProjectConfig) {
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

          // I would use the already existing graphql-config AST, but there are a few reasons we can't yet
          const contents = this._parser(document.rawSDL, uri);
          if (!contents[0]?.query) {
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
  private async _cacheAllProjectFiles(config: GraphQLConfig) {
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

  private async _updateFragmentDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const project = this._graphQLCache.getProjectForFile(uri);
    if (project) {
      const cacheKey = this._graphQLCache._cacheKeyForProject(project);
      await this._graphQLCache.updateFragmentDefinition(
        cacheKey,
        uri,
        contents,
      );
    }
  }

  private async _updateSchemaIfChanged(
    project: GraphQLProjectConfig,
    uri: Uri,
  ): Promise<void> {
    await Promise.all(
      this._unwrapProjectSchema(project).map(async schema => {
        const schemaFilePath = path.resolve(project.dirpath, schema);
        const uriFilePath = URI.parse(uri).fsPath;
        if (uriFilePath === schemaFilePath) {
          await this._graphQLCache.invalidateSchemaCacheForProject(project);
        }
      }),
    );
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

  private async _updateObjectTypeDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const project = await this._graphQLCache.getProjectForFile(uri);
    if (project) {
      const cacheKey = this._graphQLCache._cacheKeyForProject(project);

      await this._graphQLCache.updateObjectTypeDefinition(
        cacheKey,
        uri,
        contents,
      );
    }
  }

  private _getCachedDocument(uri: string): CachedDocumentType | null {
    if (this._textDocumentCache.has(uri)) {
      const cachedDocument = this._textDocumentCache.get(uri);
      if (cachedDocument) {
        return cachedDocument;
      }
    }

    return null;
  }
  private async _invalidateCache(
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

export function processDiagnosticsMessage(
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
