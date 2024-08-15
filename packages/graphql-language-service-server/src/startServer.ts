/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
import { MessageProcessor } from './MessageProcessor';
import { GraphQLConfig } from 'graphql-config';
import {
  IPCMessageReader,
  IPCMessageWriter,
  SocketMessageReader,
  SocketMessageWriter,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-jsonrpc/node';

import {
  CompletionRequest,
  CompletionResolveRequest,
  DefinitionRequest,
  DidOpenTextDocumentNotification,
  DidSaveTextDocumentNotification,
  DidChangeTextDocumentNotification,
  DidChangeConfigurationNotification,
  DidCloseTextDocumentNotification,
  ExitNotification,
  HoverRequest,
  InitializeRequest,
  PublishDiagnosticsNotification,
  DidChangeWatchedFilesNotification,
  ShutdownRequest,
  DocumentSymbolRequest,
  PublishDiagnosticsParams,
  WorkspaceSymbolRequest,
  createConnection as createLanguageServerConnection,
  Connection,
} from 'vscode-languageserver/node';

import { Logger } from './Logger';
import { parseDocument } from './parseDocument';
import {
  DEFAULT_SUPPORTED_EXTENSIONS,
  DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
  SupportedExtensionsEnum,
} from './constants';
import { LoadConfigOptions, ServerOptions } from './types';
import { createConnection } from 'node:net';

/**
 * Make loadConfigOptions
 */
export type MappedServerOptions = Omit<ServerOptions, 'loadConfigOptions'> & {
  loadConfigOptions: Omit<LoadConfigOptions, 'rootDir'> & { rootDir: string };
};

/**
 * Legacy mappings for < 2.5.0
 * @param options {ServerOptions}
 */
export const buildOptions = (options: ServerOptions): MappedServerOptions => {
  const serverOptions = { ...options } as MappedServerOptions;

  if (serverOptions.loadConfigOptions) {
    const { extensions, rootDir } = serverOptions.loadConfigOptions;
    if (extensions) {
      serverOptions.loadConfigOptions.extensions = extensions;
    }
    if (!rootDir) {
      if (serverOptions.configDir) {
        serverOptions.loadConfigOptions.rootDir = serverOptions.configDir;
      } else {
        serverOptions.loadConfigOptions.rootDir = process.cwd();
      }
    }
  } else {
    serverOptions.loadConfigOptions = {
      rootDir: options.configDir || process.cwd(),
      extensions: serverOptions.extensions || [],
    };
  }
  return serverOptions;
};

/**
 * startServer - initialize LSP server with options
 *
 * @param options {ServerOptions} server initialization methods
 * @returns {Promise<void>}
 */
export default async function startServer(
  options?: ServerOptions,
): Promise<Connection | void> {
  const finalOptions = buildOptions({ method: 'node', ...options });
  let reader;
  let writer;
  switch (finalOptions.method) {
    case 'socket':
      // For socket connection, the message connection needs to be
      // established before the server socket starts listening.
      // Do that, and return at the end of this block.
      if (!finalOptions.port) {
        process.stderr.write(
          '--port is required to establish socket connection.',
        );
        process.exit(1);
      }

      const { port, hostname, encoding } = finalOptions;
      const socket = createConnection(port, hostname ?? '127.0.01');

      reader = new SocketMessageReader(socket, encoding ?? 'utf-8');
      writer = new SocketMessageWriter(socket, encoding ?? 'utf-8');

      break;
    case 'stream':
      reader = new StreamMessageReader(process.stdin);
      writer = new StreamMessageWriter(process.stdout);
      break;

    default:
      reader = new IPCMessageReader(process);
      writer = new IPCMessageWriter(process);
      break;
  }
  const streamServer = await initializeHandlers({
    reader,
    writer,
    options: finalOptions,
  });
  streamServer.listen();
  return streamServer;
}

type InitializerParams = {
  reader: SocketMessageReader | StreamMessageReader | IPCMessageReader;
  writer: SocketMessageWriter | StreamMessageWriter | IPCMessageWriter;
  options: MappedServerOptions;
};

export async function initializeHandlers({
  reader,
  writer,
  options,
}: InitializerParams): Promise<Connection> {
  const connection = createLanguageServerConnection(reader, writer);
  const logger = new Logger(connection, options.debug);

  try {
    await addHandlers({ connection, logger, ...options });
    return connection;
  } catch (err) {
    logger.error('There was an error initializing the server connection');
    logger.error(String(err));
    process.exit(1);
  }
}

function reportDiagnostics(
  diagnostics: PublishDiagnosticsParams | null,
  connection: Connection,
) {
  if (diagnostics) {
    void connection.sendNotification(
      PublishDiagnosticsNotification.type,
      diagnostics,
    );
  }
}

type HandlerOptions = {
  connection: Connection;
  logger: Logger;
  config?: GraphQLConfig;
  parser?: typeof parseDocument;
  fileExtensions?: ReadonlyArray<SupportedExtensionsEnum>;
  graphqlFileExtensions?: string[];
  tmpDir?: string;
  loadConfigOptions: LoadConfigOptions;
};

/**
 * take the resultant message connection, and attach the matching `MessageProcessor` instance event handlers
 * similar to languageFeatures.ts in monaco language modes
 *
 * @param options {HandlerOptions}
 */
export async function addHandlers({
  connection,
  logger,
  config,
  parser,
  fileExtensions,
  graphqlFileExtensions,
  tmpDir,
  loadConfigOptions,
}: HandlerOptions): Promise<void> {
  const messageProcessor = new MessageProcessor({
    logger,
    config,
    parser,
    fileExtensions: fileExtensions || DEFAULT_SUPPORTED_EXTENSIONS,
    graphqlFileExtensions:
      graphqlFileExtensions || DEFAULT_SUPPORTED_GRAPHQL_EXTENSIONS,
    tmpDir,
    loadConfigOptions,
    connection,
  });

  connection.onNotification(
    DidOpenTextDocumentNotification.type,
    async params => {
      const diagnostics =
        await messageProcessor.handleDidOpenOrSaveNotification(params);
      reportDiagnostics(diagnostics, connection);
    },
  );
  connection.onNotification(
    DidSaveTextDocumentNotification.type,
    async params => {
      const diagnostics =
        await messageProcessor.handleDidOpenOrSaveNotification(params);
      reportDiagnostics(diagnostics, connection);
    },
  );
  connection.onNotification(
    DidChangeTextDocumentNotification.type,
    async params => {
      const diagnostics =
        await messageProcessor.handleDidChangeNotification(params);
      reportDiagnostics(diagnostics, connection);
    },
  );

  connection.onNotification(
    DidCloseTextDocumentNotification.type,
    messageProcessor.handleDidCloseNotification,
  );
  connection.onRequest(ShutdownRequest.type, () =>
    messageProcessor.handleShutdownRequest(),
  );
  connection.onNotification(ExitNotification.type, () =>
    messageProcessor.handleExitNotification(),
  );

  // Ignore cancel requests
  connection.onNotification('$/cancelRequest', () => ({}));

  connection.onRequest(InitializeRequest.type, (params, token) =>
    messageProcessor.handleInitializeRequest(
      params,
      token,
      loadConfigOptions.rootDir,
    ),
  );

  connection.onRequest(CompletionRequest.type, params =>
    messageProcessor.handleCompletionRequest(params),
  );

  connection.onRequest(CompletionResolveRequest.type, item => item);

  connection.onRequest(DefinitionRequest.type, params =>
    messageProcessor.handleDefinitionRequest(params),
  );

  connection.onRequest(HoverRequest.type, params =>
    messageProcessor.handleHoverRequest(params),
  );

  connection.onNotification(DidChangeWatchedFilesNotification.type, params =>
    messageProcessor.handleWatchedFilesChangedNotification(params),
  );

  connection.onRequest(DocumentSymbolRequest.type, params =>
    messageProcessor.handleDocumentSymbolRequest(params),
  );

  connection.onRequest(WorkspaceSymbolRequest.type, params =>
    messageProcessor.handleWorkspaceSymbolRequest(params),
  );

  connection.onNotification(DidChangeConfigurationNotification.type, params =>
    messageProcessor.handleDidChangeConfiguration(params),
  );
}
