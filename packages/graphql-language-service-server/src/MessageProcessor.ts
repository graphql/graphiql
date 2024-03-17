/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
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
  GraphQLFileInfo,
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
  TextDocumentContentChangeEvent,
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
  LoaderNoResultError,
  ProjectNotFoundError,
} from 'graphql-config';
import type { LoadConfigOptions } from './types';
import {
  DEFAULT_SUPPORTED_EXTENSIONS,
  DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
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
  private _connection: Connection;
  private _graphQLCache!: GraphQLCache;
  private _languageService!: GraphQLLanguageService;
  private _textDocumentCache = new Map<string, CachedDocumentType>();
  private _isInitialized = false;
  private _isGraphQLConfigMissing: boolean | null = null;
  private _willShutdown = false;
  private _logger: Logger | NoopLogger;
  private _parser: (text: string, uri: string) => CachedContent[];
  private _tmpDir: string;
  private _tmpDirBase: string;
  private _loadConfigOptions: LoadConfigOptions;
  private _rootPath: string = process.cwd();
  private _settings: any;
  private _providedConfig?: GraphQLConfig;

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
    if (config) {
      this._providedConfig = config;
    }
    this._connection = connection;
    this._logger = logger;
    this._parser = (text, uri) => {
      const p = parser ?? parseDocument;
      return p(text, uri, fileExtensions, graphqlFileExtensions, this._logger);
    };
    this._tmpDir = tmpDir || tmpdir();
    this._tmpDirBase = path.join(this._tmpDir, 'graphql-language-service');
    // use legacy mode by default for backwards compatibility
    this._loadConfigOptions = { legacy: true, ...loadConfigOptions };

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

  public async handleInitializeRequest(
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
  // TODO next: refactor (most of) this into the `GraphQLCache` class
  async _initializeGraphQLCaches() {
    const settings = await this._connection.workspace.getConfiguration({
      section: 'graphql-config',
    });

    const vscodeSettings = await this._connection.workspace.getConfiguration({
      section: 'vscode-graphql',
    });

    // TODO: eventually we will instantiate an instance of this per workspace,
    // so rootDir should become that workspace's rootDir
    this._settings = { ...settings, ...vscodeSettings };
    const rootDir = this._settings?.load?.rootDir.length
      ? this._settings?.load?.rootDir
      : this._rootPath;
    if (settings?.dotEnvPath) {
      require('dotenv').config({
        path: path.resolve(rootDir, settings.dotEnvPath),
      });
    }
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
      // now we have the settings so we can re-build the logger
      this._logger.level = this._settings?.debug === true ? 1 : 0;
      // createServer() can be called with a custom config object, and
      // this is a public interface that may be used by customized versions of the server
      if (this._providedConfig) {
        this._graphQLCache = new GraphQLCache({
          config: this._providedConfig,
          logger: this._logger,
          parser: this._parser,
          configDir: rootDir,
        });
        this._languageService = new GraphQLLanguageService(
          this._graphQLCache,
          this._logger,
        );
      } else {
        // reload the graphql cache
        this._graphQLCache = await getGraphQLCache({
          parser: this._parser,
          loadConfigOptions: this._loadConfigOptions,
          settings: this._settings,
          logger: this._logger,
        });
        this._languageService = new GraphQLLanguageService(
          this._graphQLCache,
          this._logger,
        );
      }

      const config = this._graphQLCache.getGraphQLConfig();
      if (config) {
        await this._cacheAllProjectFiles(config);
        // TODO: per project lazy instantiation.
        // we had it working before, but it seemed like it caused bugs
        // which were caused by something else.
        // thus. _isInitialized should be replaced with something like
        // projectHasInitialized: (projectName: string) => boolean
        this._isInitialized = true;
        this._isGraphQLConfigMissing = false;
        this._logger.info('GraphQL Language Server caches initialized');
      }
    } catch (err) {
      this._handleConfigError({ err });
    }
  }
  private _handleConfigError({ err }: { err: unknown; uri?: string }) {
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
  private async _loadConfigOrSkip(uri: string) {
    try {
      const isGraphQLConfigFile = await this._isGraphQLConfigFile(uri);

      if (!this._isInitialized) {
        if (this._isGraphQLConfigMissing === true && !isGraphQLConfigFile) {
          return true;
        }
        // don't try to initialize again if we've already tried
        // and the graphql config file or package.json entry isn't even there
        await this._initializeGraphQLCaches();
        return isGraphQLConfigFile;
      }
      // if it has initialized, but this is another config file change, then let's handle it
      if (isGraphQLConfigFile) {
        await this._initializeGraphQLCaches();
      }
      return isGraphQLConfigFile;
    } catch (err) {
      this._logger.error(String(err));
      // return true if it's a graphql config file so we don't treat
      // this as a non-config file if it is one
      return true;
    }
  }

  public async handleDidOpenOrSaveNotification(
    params: DidSaveTextDocumentParams | DidOpenTextDocumentParams,
  ): Promise<PublishDiagnosticsParams> {
    const { textDocument } = params;
    const { uri } = textDocument;

    /**
     * Initialize the LSP server when the first file is opened or saved,
     * so that we can access the user settings for config rootDir, etc
     */
    const shouldSkip = await this._loadConfigOrSkip(uri);
    // if we're loading config or the config is missing or there's an error
    // don't do anything else
    if (shouldSkip) {
      return { uri, diagnostics: [] };
    }

    // Here, we set the workspace settings in memory,
    // and re-initialize the language service when a different
    // root path is detected.
    // We aren't able to use initialization event for this
    // and the config change event is after the fact.

    if (!textDocument) {
      throw new Error('`textDocument` argument is required.');
    }

    const diagnostics: Diagnostic[] = [];

    if (!this._isInitialized) {
      return { uri, diagnostics };
    }
    try {
      const project = this._graphQLCache.getProjectForFile(uri);
      if (project) {
        // the disk is always valid here, so the textDocument.text isn't useful I don't think
        // const text = 'text' in textDocument && textDocument.text;
        // for some reason if i try to tell to not parse empty files, it breaks :shrug:
        // i think this is because if the file change is empty, it doesn't get parsed
        // TODO: this could be related to a bug in how we are calling didOpenOrSave in our tests
        // that doesn't reflect the real runtime behavior

        const { contents } = await this._parseAndCacheFile(uri, project);
        if (project?.extensions?.languageService?.enableValidation !== false) {
          await Promise.all(
            contents.map(async ({ documentString, range }) => {
              const results = await this._languageService.getDiagnostics(
                documentString,
                uri,
                this._isRelayCompatMode(documentString),
              );
              if (results && results.length > 0) {
                diagnostics.push(
                  ...processDiagnosticsMessage(results, documentString, range),
                );
              }
            }),
          );
        }
      }

      this._logger.log(
        JSON.stringify({
          type: 'usage',
          messageType: 'textDocument/didOpenOrSave',
          projectName: project?.name,
          fileName: uri,
        }),
      );
      return { uri, diagnostics };
    } catch (err) {
      this._handleConfigError({ err, uri });
      return { uri, diagnostics };
    }
  }

  public async handleDidChangeNotification(
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

    try {
      const project = this._graphQLCache.getProjectForFile(uri);
      if (!project) {
        return { uri, diagnostics: [] };
      }

      // As `contentChanges` is an array, and we just want the
      // latest update to the text, grab the last entry from the array.

      // If it's a .js file, try parsing the contents to see if GraphQL queries
      // exist. If not found, delete from the cache.
      const { contents } = await this._parseAndCacheFile(
        uri,
        project,
        contentChanges,
      );
      // // If it's a .graphql file, proceed normally and invalidate the cache.
      // await this._invalidateCache(textDocument, uri, contents);

      const diagnostics: Diagnostic[] = [];

      if (project?.extensions?.languageService?.enableValidation !== false) {
        // Send the diagnostics onChange as well
        try {
          await Promise.all(
            contents.map(async ({ documentString, range }) => {
              const results = await this._languageService.getDiagnostics(
                documentString,
                uri,
                this._isRelayCompatMode(documentString),
              );
              if (results && results.length > 0) {
                diagnostics.push(
                  ...processDiagnosticsMessage(results, documentString, range),
                );
              }
              // skip diagnostic errors, usually related to parsing incomplete fragments
            }),
          );
        } catch {}
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
    await this._initializeGraphQLCaches();
    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'workspace/didChangeConfiguration',
      }),
    );
    return {};
  }

  public handleDidCloseNotification(params: DidCloseTextDocumentParams): void {
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

  public handleShutdownRequest(): void {
    this._willShutdown = true;
  }

  public handleExitNotification(): void {
    process.exit(this._willShutdown ? 0 : 1);
  }

  private validateDocumentAndPosition(params: CompletionParams): void {
    if (!params?.textDocument?.uri || !params.position) {
      throw new Error(
        '`textDocument.uri` and `position` arguments are required.',
      );
    }
  }

  public async handleCompletionRequest(
    params: CompletionParams,
  ): Promise<CompletionList> {
    if (!this._isInitialized) {
      return { items: [], isIncomplete: false };
    }

    this.validateDocumentAndPosition(params);

    const { textDocument, position } = params;

    // `textDocument/completion` event takes advantage of the fact that
    // `textDocument/didChange` event always fires before, which would have
    // updated the cache with the query text from the editor.
    // Treat the computed list always complete.

    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      return { items: [], isIncomplete: false };
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange?.containsPosition(toPosition(position))) {
        return true;
      }
    });

    // If there is no GraphQL query in this file, return an empty result.
    if (!found) {
      return { items: [], isIncomplete: false };
    }

    const { documentString, range } = found;

    if (range) {
      position.line -= range.start.line;
    }

    const result = await this._languageService.getAutocompleteSuggestions(
      documentString,
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

  public async handleHoverRequest(
    params: TextDocumentPositionParams,
  ): Promise<Hover> {
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

    const { documentString, range } = found;

    if (range) {
      position.line -= range.start.line;
    }
    const result = await this._languageService.getHoverInformation(
      documentString,
      toPosition(position),
      textDocument.uri,
      { useMarkdown: true },
    );

    return {
      contents: result,
    };
  }

  private async _parseAndCacheFile(
    uri: string,
    project: GraphQLProjectConfig,
    changes?: TextDocumentContentChangeEvent[],
  ) {
    try {
      // const fileText = text || (await readFile(URI.parse(uri).fsPath, 'utf-8'));
      // const contents = this._parser(fileText, uri);
      // const cachedDocument = this._textDocumentCache.get(uri);
      // const version = cachedDocument ? cachedDocument.version++ : 0;
      // await this._invalidateCache({ uri, version }, uri, contents);
      // await this._updateFragmentDefinition(uri, contents);
      // await this._updateObjectTypeDefinition(uri, contents, project);

      const result = await this._graphQLCache.readAndCacheFile(uri, changes);
      await this._updateSchemaIfChanged(project, uri);

      if (result) {
        return { contents: result.contents ?? [], version: 0 };
      }
      return { contents: [], version: 0 };
    } catch {
      return { contents: [], version: 0 };
    }
  }

  public async handleWatchedFilesChangedNotification(
    params: DidChangeWatchedFilesParams,
  ): Promise<Array<PublishDiagnosticsParams | undefined> | null> {
    const resultsForChanges = Promise.all(
      params.changes.map(async (change: FileEvent) => {
        const shouldSkip = await this._loadConfigOrSkip(change.uri);
        if (shouldSkip) {
          return { uri: change.uri, diagnostics: [] };
        }
        if (
          change.type === FileChangeTypeKind.Created ||
          change.type === FileChangeTypeKind.Changed
        ) {
          const { uri } = change;

          try {
            let diagnostics: Diagnostic[] = [];
            const project = this._graphQLCache.getProjectForFile(uri);
            if (project) {
              // Important! Use system file uri not file path here!!!!
              const { contents } = await this._parseAndCacheFile(uri, project);
              console.log({ contents, uri }, 'watched');
              if (
                project?.extensions?.languageService?.enableValidation !== false
              ) {
                diagnostics = (
                  await Promise.all(
                    contents.map(async ({ documentString, range }) => {
                      const results =
                        await this._languageService.getDiagnostics(
                          documentString,
                          uri,
                          this._isRelayCompatMode(documentString),
                        );
                      if (results && results.length > 0) {
                        return processDiagnosticsMessage(
                          results,
                          documentString,
                          range,
                        );
                      }
                      return [];
                    }),
                  )
                ).reduce((left, right) => left.concat(right), diagnostics);
              }

              return { uri, diagnostics };
            }
            // skip diagnostics errors usually from incomplete files
          } catch {}
          return { uri, diagnostics: [] };
        }
        if (change.type === FileChangeTypeKind.Deleted) {
          const cache = await this._getDocumentCacheForFile(change.uri);
          cache?.delete(change.uri);
          await this._updateFragmentDefinition(change.uri, []);
          await this._updateObjectTypeDefinition(change.uri, []);
        }
      }),
    );
    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'workspace/didChangeWatchedFiles',
        files: params.changes.map(change => change.uri),
      }),
    );
    return resultsForChanges;
  }

  public async handleDefinitionRequest(
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
    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      return [];
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content?.range;
      if (currentRange?.containsPosition(toPosition(position))) {
        return true;
      }
    });

    // If there is no GraphQL query in this file, return an empty result.
    if (!found) {
      return [];
    }

    const { documentString, range: parentRange } = found;
    // if (parentRange) {
    //   position.line -= parentRange.start.line;
    // }

    let result = null;

    try {
      result = await this._languageService.getDefinition(
        documentString,
        toPosition(position),
        textDocument.uri,
      );
    } catch {
      // these thrown errors end up getting fired before the service is initialized, so lets cool down on that
    }

    const inlineFragments: string[] = [];
    try {
      visit(parse(documentString), {
        FragmentDefinition(node: FragmentDefinitionNode) {
          inlineFragments.push(node.name.value);
        },
      });
    } catch {}

    const formatted = result
      ? result.definitions.map(res => {
          const defRange = res.range as Range;

          if (parentRange && res.name) {
            const isInline = inlineFragments?.includes(res.name);
            const isEmbedded = DEFAULT_SUPPORTED_EXTENSIONS.includes(
              path.extname(res.path) as SupportedExtensionsEnum,
            );

            if (isEmbedded || isInline) {
              const cachedDoc = this._getCachedDocument(
                URI.parse(res.path).toString(),
              );
              const vOffset = isEmbedded
                ? cachedDoc?.contents[0].range?.start.line ?? 0
                : parentRange.start.line;

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

  public async handleDocumentSymbolRequest(
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
        cachedDocument.contents[0].documentString.length
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
      cachedDocument.contents[0].documentString,
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

  public async handleWorkspaceSymbolRequest(
    params: WorkspaceSymbolParams,
  ): Promise<Array<SymbolInformation>> {
    if (!this._isInitialized) {
      return [];
    }

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
            cachedDocument.contents[0].documentString,
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

  private async _cacheSchemaText(
    uri: string,
    text: string,
    version: number,
    project?: GraphQLProjectConfig,
  ) {
    try {
      const contents = this._parser(text, uri);
      if (contents.length > 0) {
        await this._invalidateCache({ version, uri }, uri, contents);
        await this._updateObjectTypeDefinition(uri, contents, project);
      }
    } catch (err) {
      this._logger.error(String(err));
    }
  }
  private async _cacheSchemaFile(
    fileUri: UnnormalizedTypeDefPointer,
    project: GraphQLProjectConfig,
  ) {
    try {
      // const parsedUri = URI.file(fileUri.toString());
      // @ts-expect-error
      const matches = await glob(fileUri, {
        cwd: project.dirpath,
        absolute: true,
      });
      const uri = matches[0];
      let version = 1;
      if (uri) {
        const schemaUri = URI.file(uri).toString();
        const schemaDocument = this._getCachedDocument(schemaUri);

        if (schemaDocument) {
          version = schemaDocument.version++;
        }
        const schemaText = await readFile(uri, 'utf8');
        await this._cacheSchemaText(schemaUri, schemaText, version);
      }
    } catch (err) {
      this._logger.error(String(err));
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
    const allExtensions = [
      ...DEFAULT_SUPPORTED_EXTENSIONS,
      ...DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
    ];
    // only local schema lookups if all of the schema entries are local files
    const sdlOnly = unwrappedSchema.every(schemaEntry =>
      allExtensions.some(
        // local schema file URIs for lookup don't start with http, and end with an extension.
        // though it isn't often used, technically schema config could include a remote .graphql file
        ext => !schemaEntry.startsWith('http') && schemaEntry.endsWith(ext),
      ),
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
        this._graphQLCache._schemaMap.set(project.name, { schema });
        if (!cachedSchemaDoc) {
          await writeFile(fsPath, schemaText, 'utf8');
          await this._cacheSchemaText(uri, schemaText, 0, project);
        }
        // do we have a change in the getSchema result? if so, update schema cache
        if (cachedSchemaDoc) {
          writeFileSync(fsPath, schemaText, 'utf8');
          await this._cacheSchemaText(
            uri,
            schemaText,
            cachedSchemaDoc.version++,
            project,
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
          if (!contents[0]?.documentString) {
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
          const cacheKey = this._graphQLCache._cacheKeyForProject(project);
          const { objectTypeDefinitions, graphQLFileMap, fragmentDefinitions } =
            await this._graphQLCache._buildCachesFromInputDirs(
              project.dirpath,
              project,
            );

          this._graphQLCache._typeDefinitionsCache.set(
            cacheKey,
            objectTypeDefinitions,
          );
          this._graphQLCache._graphQLFileListCache.set(
            cacheKey,
            graphQLFileMap,
          );
          this._graphQLCache._fragmentDefinitionsCache.set(
            cacheKey,
            fragmentDefinitions,
          );
          if (!project.documents) {
            this._logger.warn(
              [
                `No 'documents' config found for project: ${projectName}.`,
                'Fragments and query documents cannot be detected.',
                'LSP server will only perform some partial validation and SDL features.',
              ].join('\n'),
            );
          }
        }),
      );
    }
  }
  _isRelayCompatMode(query: string): boolean {
    return (
      query?.includes('RelayCompat') || query?.includes('react-relay/compat')
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
          try {
            const file = await readFile(schemaFilePath, 'utf-8');
            // only invalidate the schema cache if we can actually parse the file
            // otherwise, leave the last valid one in place
            parse(file, { noLocation: true });
            this._graphQLCache.invalidateSchemaCacheForProject(project);
          } catch {}
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
    project?: GraphQLProjectConfig,
  ): Promise<void> {
    const resolvedProject =
      project ?? (await this._graphQLCache.getProjectForFile(uri));
    if (resolvedProject) {
      const cacheKey = this._graphQLCache._cacheKeyForProject(resolvedProject);
      await this._graphQLCache.updateObjectTypeDefinition(
        cacheKey,
        uri,
        contents,
      );
    }
  }

  private _getDocumentCacheForFile(
    uri: string,
  ): Map<string, GraphQLFileInfo> | undefined {
    const project = this._graphQLCache.getProjectForFile(uri);
    if (project) {
      return this._graphQLCache._graphQLFileListCache.get(
        this._graphQLCache._cacheKeyForProject(project),
      );
    }
  }

  private _getCachedDocument(uri: string): CachedDocumentType | null {
    const project = this._graphQLCache.getProjectForFile(uri);
    if (project) {
      const cachedDocument = this._graphQLCache._getCachedDocument(
        uri,
        project,
      );
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
    let documentCache = this._getDocumentCacheForFile(uri);
    if (!documentCache) {
      const project = await this._graphQLCache.getProjectForFile(uri);
      if (!project) {
        return null;
      }
      documentCache = new Map();
      this._graphQLCache._graphQLFileListCache.set(
        this._graphQLCache._cacheKeyForProject(project),
        documentCache,
      );
    }
    if (documentCache?.has(uri)) {
      const cachedDocument = documentCache.get(uri);
      if (
        cachedDocument &&
        textDocument &&
        textDocument?.version &&
        cachedDocument.version < textDocument.version
      ) {
        // Current server capabilities specify the full sync of the contents.
        // Therefore always overwrite the entire content.
        return documentCache.set(uri, {
          version: textDocument.version,
          contents,
        });
      }
    }
    return documentCache.set(uri, {
      version: textDocument.version ?? 0,
      contents,
    });
  }
}

export function processDiagnosticsMessage(
  results: Diagnostic[],
  query: string,
  range?: RangeType,
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
