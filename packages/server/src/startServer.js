/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import net from 'net';

import {MessageProcessor} from './MessageProcessor';

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
  InitializeRequest,
  PublishDiagnosticsNotification,
  ShutdownRequest,
} from 'vscode-languageserver';

import {Logger} from './Logger';

type Options = {
  port?: number,
  method?: string,
  configDir?: string,
};

export default (async function startServer(options: Options): Promise<void> {
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
          return;
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
            const connection = createMessageConnection(reader, writer, logger);
            addHandlers(connection, options.configDir, logger);
            connection.listen();
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
    const connection = createMessageConnection(reader, writer, logger);
    addHandlers(connection, options.configDir, logger);
    connection.listen();
  }
});

function addHandlers(
  connection: MessageConnection,
  configDir?: string,
  logger: Logger,
): void {
  const messageProcessor = new MessageProcessor(logger);
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
}
