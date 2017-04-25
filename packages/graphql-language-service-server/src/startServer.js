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
  IPCMessageReader,
  IPCMessageWriter,
  SocketMessageReader,
  SocketMessageWriter,
} from 'vscode-jsonrpc';

type Options = {
  port?: number,
  method?: string,
  configDir?: string,
};

export default (async function startServer(options?: Options): Promise<void> {
  if (!options || !options.configDir) {
    process.stderr.write('--configDir is required!');
    process.exit(1);
  }

  const configDir = options.configDir;
  if (options && options.method) {
    switch (options.method) {
      case 'stream':
        connectWithStream(configDir);
        break;
      case 'socket':
        connectWithSocket(configDir, options.port);
        break;
      case 'node':
      default:
        connectWithNodeIPC(configDir);
        break;
    }
  }
});

function connectWithSocket(configDir: string, port: number): Promise<void> {
  const socket = net.createServer(client => {
    client.setEncoding('utf8');
    const messageReader = new SocketMessageReader(client);
    const messageWriter = new SocketMessageWriter(client);

    client.on('end', () => {
      socket.close();
      process.exit(0);
    });

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
  });

  socket.listen(port);
}

function connectWithNodeIPC(configDir: string): Promise<void> {
  // IPC protocol support
  // The language server protocol specifies that the client starts sending
  // messages when the server starts. Start listening from this point.
  const ipcWriter = new IPCMessageWriter(process);
  const ipcReader = new IPCMessageReader(process);
  ipcReader.listen(message => {
    try {
      if (message.id != null) {
        processIPCRequestMessage(message, configDir, ipcWriter);
      } else {
        processIPCNotificationMessage(message, ipcWriter);
      }
    } catch (error) {
      // Swallow error silently.
    }
  });
}

function connectWithStream(configDir: string): Promise<void> {
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
}
