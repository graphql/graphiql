/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import * as net from 'net';
import { MessageProcessor } from './MessageProcessor';
import { GraphQLConfig } from 'graphql-config';

import {
  createMessageConnection,
  IPCMessageReader,
  IPCMessageWriter,
  MessageConnection,
  SocketMessageReader,
  SocketMessageWriter,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-jsonrpc';

import {
  CompletionRequest,
  CompletionResolveRequest,
  DefinitionRequest,
  DidOpenTextDocumentNotification,
  DidSaveTextDocumentNotification,
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  ExitNotification,
  HoverRequest,
  InitializeRequest,
  PublishDiagnosticsNotification,
  DidChangeWatchedFilesNotification,
  ShutdownRequest,
  DocumentSymbolRequest,
  // WorkspaceSymbolRequest,
  // ReferencesRequest,
} from 'vscode-languageserver';

import { Logger } from './Logger';
import { parseDocument } from 'graphql-languageservice';

export type ServerOptions = {
  // port for the LSP server to run on. required if using method socket
  port?: number;
  // socket, streams, or node (ipc)
  method?: 'socket' | 'stream' | 'node';
  // the directory where graphql-config is found
  configDir?: string;
  // array of functions to transform the graphql-config and add extensions dynamically
  extensions?: Array<(config: GraphQLConfig) => GraphQLConfig>;
  fileExtensions?: string[];
  // pre-existing GraphQLConfig
  config?: GraphQLConfig;
  parser?: typeof parseDocument;
};

/**
 * startServer - initialize LSP server with options
 *
 * @param options {ServerOptions} server initialization methods
 * @returns {Promise<void>}
 */
export default async function startServer(
  options: ServerOptions,
): Promise<void> {
  const logger = new Logger();
  if (options && options.method) {
    let reader;
    let writer;
    switch (options.method) {
      case 'socket':
        // For socket connection, the message connection needs to be
        // established before the server socket starts listening.
        // Do that, and return at the end of this block.
        if (!options.port) {
          process.stderr.write(
            '--port is required to establish socket connection.',
          );
          process.exit(1);
        }

        const port = options.port;
        const socket = net
          .createServer(client => {
            client.setEncoding('utf8');
            reader = new SocketMessageReader(client);
            writer = new SocketMessageWriter(client);
            client.on('end', () => {
              socket.close();
              process.exit(0);
            });
            const serverWithHandlers = initializeHandlers({
              reader,
              writer,
              logger,
              options,
            });

            serverWithHandlers.listen();
          })
          .listen(port);
        return;
      case 'stream':
        reader = new StreamMessageReader(process.stdin);
        writer = new StreamMessageWriter(process.stdout);
        break;
      case 'node':
      default:
        reader = new IPCMessageReader(process);
        writer = new IPCMessageWriter(process);
        break;
    }

    try {
      const serverWithHandlers = initializeHandlers({
        reader,
        writer,
        logger,
        options,
      });
      return serverWithHandlers.listen();
    } catch (err) {
      logger.error('There was a Graphql LSP handler exception:');
      logger.error(err);
    }
  }
}

function initializeHandlers({
  reader,
  writer,
  logger,
  options = {},
}: {
  reader: SocketMessageReader | StreamMessageReader | IPCMessageReader;
  writer: SocketMessageWriter | StreamMessageWriter | IPCMessageWriter;
  logger: Logger;
  options: ServerOptions;
}): MessageConnection {
  try {
    const connection = createMessageConnection(reader, writer, logger);
    addHandlers(
      connection,
      logger,
      options.configDir,
      options?.extensions || [],
      options.config,
      options.parser,
      options.fileExtensions,
    );
    return connection;
  } catch (err) {
    logger.error('There was an error initializing the server connection');
    logger.error(err);
    process.exit(1);
  }
}

function addHandlers(
  connection: MessageConnection,
  logger: Logger,
  configDir?: string,
  extensions?: Array<(config: GraphQLConfig) => GraphQLConfig>,
  config?: GraphQLConfig,
  parser?: typeof parseDocument,
  fileExtensions?: string[],
): void {
  const messageProcessor = new MessageProcessor(
    logger,
    extensions,
    config,
    parser,
    fileExtensions,
  );
  connection.onNotification(
    DidOpenTextDocumentNotification.type,
    async params => {
      const diagnostics = await messageProcessor.handleDidOpenOrSaveNotification(
        params,
      );
      if (diagnostics) {
        connection.sendNotification(
          PublishDiagnosticsNotification.type,
          diagnostics,
        );
      }
    },
  );
  connection.onNotification(
    DidSaveTextDocumentNotification.type,
    async params => {
      const diagnostics = await messageProcessor.handleDidOpenOrSaveNotification(
        params,
      );
      if (diagnostics) {
        connection.sendNotification(
          PublishDiagnosticsNotification.type,
          diagnostics,
        );
      }
    },
  );
  connection.onNotification(
    DidChangeTextDocumentNotification.type,
    async params => {
      const diagnostics = await messageProcessor.handleDidChangeNotification(
        params,
      );
      if (diagnostics) {
        connection.sendNotification(
          PublishDiagnosticsNotification.type,
          diagnostics,
        );
      }
    },
  );

  connection.onNotification(DidCloseTextDocumentNotification.type, params =>
    messageProcessor.handleDidCloseNotification(params),
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
    messageProcessor.handleInitializeRequest(params, token, configDir),
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
  // connection.onRequest(WorkspaceSymbolRequest.type, params =>
  //   messageProcessor.handleWorkspaceSymbolRequest(params),
  // );
  // connection.onRequest(ReferencesRequest.type, params =>
  //   messageProcessor.handleReferencesRequest(params),
  // );
}
