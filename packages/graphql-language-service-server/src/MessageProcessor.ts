/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { existsSync } from 'fs';
import { CachedContent, GraphQLConfig } from 'graphql-language-service';
import mkdirp from 'mkdirp';
import * as path from 'path';
import { URI } from 'vscode-uri';

import type {
  CompletionParams,
  DidChangeConfigurationParams,
  DidOpenTextDocumentParams,
  DidSaveTextDocumentParams,
  FileEvent,
} from 'vscode-languageserver/node';

import type {
  CancellationToken,
  CompletionItem,
  CompletionList,
  Connection,
  DidChangeConfigurationRegistrationOptions,
  DidChangeTextDocumentParams,
  DidChangeWatchedFilesParams,
  DidCloseTextDocumentParams,
  DocumentSymbolParams,
  Hover,
  InitializeParams,
  InitializeResult,
  Location,
  PublishDiagnosticsParams,
  SymbolInformation,
  TextDocumentPositionParams,
  WorkspaceSymbolParams,
} from 'vscode-languageserver/node';

import { parseDocument } from './parseDocument';

import { tmpdir } from 'os';
import { Logger } from './Logger';
import type { LoadConfigOptions } from './types';
import { WorkspaceMessageProcessor } from './WorkspaceMessageProcessor';

export class MessageProcessor {
  _connection: Connection;
  _graphQLConfig: GraphQLConfig | undefined;
  _willShutdown: boolean;
  _logger: Logger;
  _parser: (text: string, uri: string) => CachedContent[];
  _tmpDir: string;
  _loadConfigOptions: LoadConfigOptions;
  _rootPath: string = process.cwd();
  _sortedWorkspaceUris: string[] = [];
  _processors: Map<string, WorkspaceMessageProcessor> = new Map();

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
    this._willShutdown = false;
    this._logger = logger;
    this._graphQLConfig = config;
    this._parser = (text, uri) => {
      const p = parser ?? parseDocument;
      return p(text, uri, fileExtensions, graphqlFileExtensions, this._logger);
    };
    this._tmpDir = tmpDir || tmpdir();

    const tmpDirBase = path.join(this._tmpDir, 'graphql-language-service');
    // use legacy mode by default for backwards compatibility
    this._loadConfigOptions = { legacy: true, ...loadConfigOptions };

    if (!existsSync(tmpDirBase)) {
      mkdirp(tmpDirBase);
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

    this._sortedWorkspaceUris = params.workspaceFolders
      ?.map(ws => ws.uri)
      .sort((a, b) => b.length - a.length) ?? [
      URI.file(
        configDir ? configDir.trim() : params.rootUri || this._rootPath,
      ).toString(),
    ];

    this._sortedWorkspaceUris.forEach(uri => {
      this._processors.set(
        uri,
        new WorkspaceMessageProcessor({
          connection: this._connection,
          loadConfigOptions: this._loadConfigOptions,
          logger: this._logger,
          parser: this._parser,
          tmpDir: this._tmpDir,
          config: this._graphQLConfig,
          rootPath: URI.parse(uri).fsPath,
        }),
      );
    });

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

  _findWorkspaceProcessor(uri: string): WorkspaceMessageProcessor | undefined {
    const workspace = this._sortedWorkspaceUris.find(wsUri =>
      uri.startsWith(wsUri),
    );
    return this._processors.get(workspace ?? '');
  }

  async handleDidOpenOrSaveNotification(
    params: DidSaveTextDocumentParams | DidOpenTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }
    const { uri } = params.textDocument;
    return (
      this._findWorkspaceProcessor(uri)?.handleDidOpenOrSaveNotification(
        params,
      ) ?? { uri, diagnostics: [] }
    );
  }

  async handleDidChangeNotification(
    params: DidChangeTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
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
    return (
      this._findWorkspaceProcessor(
        params.textDocument.uri,
      )?.handleDidChangeNotification(params) ?? null
    );
  }

  async handleDidChangeConfiguration(
    params: DidChangeConfigurationParams,
  ): Promise<DidChangeConfigurationRegistrationOptions> {
    if (!params?.settings || params?.settings.length === 0) {
      return {};
    }

    // reset all the workspace caches
    // and prepare for them to lazily re-build based
    // on where the user opens and saves files
    await Promise.all(
      Array.from(this._processors.values()).map(async processor => {
        await processor._initializeConfig();
      }),
    );
    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'workspace/didChangeConfiguration',
      }),
    );
    return {};
  }

  handleDidCloseNotification(params: DidCloseTextDocumentParams): void {
    // For every `textDocument/didClose` event, delete the cached entry.
    // This is to keep a low memory usage && switch the source of truth to
    // the file on disk.
    if (!params || !params.textDocument) {
      throw new Error('`textDocument` is required.');
    }
    const { uri } = params.textDocument;
    this._findWorkspaceProcessor(uri)?.handleDidCloseNotification(params);
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
    this.validateDocumentAndPosition(params);

    return (
      this._findWorkspaceProcessor(
        params.textDocument.uri,
      )?.handleCompletionRequest(params) ?? []
    );
  }

  async handleHoverRequest(params: TextDocumentPositionParams): Promise<Hover> {
    this.validateDocumentAndPosition(params);

    return (
      this._findWorkspaceProcessor(params.textDocument.uri)?.handleHoverRequest(
        params,
      ) ?? {
        contents: [],
      }
    );
  }

  async handleWatchedFilesChangedNotification(
    params: DidChangeWatchedFilesParams,
  ): Promise<Array<PublishDiagnosticsParams | undefined> | null> {
    return Promise.all(
      params.changes.map(async (change: FileEvent) => {
        return (
          this._findWorkspaceProcessor(
            change.uri,
          )?.handleWatchedFileChangedNotification(change) ?? undefined
        );
      }),
    );
  }

  async handleDefinitionRequest(
    params: TextDocumentPositionParams,
    _token?: CancellationToken,
  ): Promise<Array<Location>> {
    if (!params || !params.textDocument || !params.position) {
      throw new Error('`textDocument` and `position` arguments are required.');
    }
    return (
      this._findWorkspaceProcessor(
        params.textDocument.uri,
      )?.handleDefinitionRequest(params, _token) ?? []
    );
  }

  async handleDocumentSymbolRequest(
    params: DocumentSymbolParams,
  ): Promise<Array<SymbolInformation>> {
    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }

    return (
      this._findWorkspaceProcessor(
        params.textDocument.uri,
      )?.handleDocumentSymbolRequest(params) ?? []
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

    return Promise.all(
      Array.from(this._processors.values()).flatMap(processor =>
        processor.handleWorkspaceSymbolRequest(params),
      ),
    ).then(symbolsList => symbolsList.flat());
  }
}
