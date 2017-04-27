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

import {
  handleCompletionRequest,
  handleDefinitionRequest,
  handleDidChangeNotification,
  handleDidCloseNotification,
  handleDidOpenOrSaveNotification,
  handleInitializeRequest,
} from './MessageProcessor';

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
} from 'vscode-languageserver';

type Options = {
  port?: number,
  method?: string,
  configDir?: string,
};

export default (async function startServer(options?: Options): Promise<void> {
  if (!options) {
    process.stderr.write('At least --configDir option is required.');
    process.exit(1);
    return;
  }
  if (!options.configDir) {
    process.stderr.write('--configDir is required.');
    process.exit(1);
    return;
  }

  const configDir = options.configDir;
  if (options && options.method) {
    let reader;
    let writer;
    switch (options.method) {
      case 'stream':
        reader = new StreamMessageReader(process.stdin);
        writer = new StreamMessageWriter(process.stdout);
        break;
      case 'socket':
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
          })
          .listen(port);
        break;
      case 'node':
      default:
        reader = new IPCMessageReader(process);
        writer = new IPCMessageWriter(process);
        break;
    }
    const connection = createMessageConnection(reader, writer);
    addHandlers(connection, configDir);
    connection.listen();
  }
});

function addHandlers(connection: MessageConnection, configDir?: string): void {
  connection.onNotification(
    DidOpenTextDocumentNotification.type,
    async params => {
      const diagnostics = await handleDidOpenOrSaveNotification(params);
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
      const diagnostics = await handleDidOpenOrSaveNotification(params);
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
      const diagnostics = await handleDidChangeNotification(params);
      if (diagnostics) {
        connection.sendNotification(
          PublishDiagnosticsNotification.type,
          diagnostics,
        );
      }
    },
  );
  connection.onNotification(
    DidCloseTextDocumentNotification.type,
    handleDidCloseNotification,
  );
  connection.onNotification(ExitNotification.type, () => process.exit(0));
  // Ignore cancel requests
  connection.onNotification('$/cancelRequest', () => ({}));

  connection.onRequest(InitializeRequest.type, (params, token) =>
    handleInitializeRequest(params, token, configDir));
  connection.onRequest(CompletionRequest.type, handleCompletionRequest);
  connection.onRequest(CompletionResolveRequest.type, item => item);
  connection.onRequest(DefinitionRequest.type, handleDefinitionRequest);
}
