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
  processStreamMessage,
  processIPCRequestMessage,
  processIPCNotificationMessage,
} from './MessageProcessor';

import {
  IPCMessageWriter,
  SocketMessageReader,
  SocketMessageWriter,
} from 'vscode-jsonrpc';

type ServerOptions = {
  port?: number,
};

export default (async function startServer(
  configDir: ?string,
  options?: ServerOptions,
): Promise<void> {
  if (options && options.port) {
    // Socket protocol support
    const socket = net.connect(options.port);
    socket.setEncoding('utf8');
    const messageReader = new SocketMessageReader(socket);
    const messageWriter = new SocketMessageWriter(socket);

    socket.on('close', () => process.exit(0));

    messageReader.listen(message => {
      try {
        if (message.id != null) {
          processIPCRequestMessage(message, configDir, messageWriter);
        } else {
          processIPCNotificationMessage(message, messageWriter);
        }
      } catch (error) {
        // Swallow error silently.
      }
    });
  }

  // IPC protocol support
  // The language server protocol specifies that the client starts sending
  // messages when the server starts. Start listening from this point.
  const ipcWriter = new IPCMessageWriter(process);
  process.on('message', message => {
    // TODO: support the header part of the language server protocol
    // Recognize the Content-Length header
    if (
      typeof message === 'string' && message.indexOf('Content-Length') === 0
    ) {
      return;
    }

    if (message.id != null) {
      processIPCRequestMessage(message, configDir, ipcWriter);
    } else {
      processIPCNotificationMessage(message, ipcWriter);
    }
  });

  // Stream (stdio) protocol support
  // Depending on the size of the query, incomplete query strings
  // may be streamed in. The below code tries to detect the end of current
  // batch of streamed data, splits the batch into appropriate JSON string,
  // and calls the function to process those messages.
  // This might get tricky since the query string needs to preserve the newline
  // characters to ensure the correct Range/Point values gets computed by the
  // language service interface methods. The current solution is to flow the
  // stream until aggregated data ends with the unescaped newline character,
  // pauses the stream and process the messages, and resumes back the stream
  // for another batch.
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    data += chunk.toString();

    // Check if the current buffer contains newline character.
    const flagPosition = data.indexOf('\r\n');
    if (flagPosition !== -1) {
      // There may be more than one message in the buffer.
      const messages = data.split('\r\n');
      data = messages.pop().trim();
      messages.forEach(message => processStreamMessage(message, configDir));
    }
  });
});
