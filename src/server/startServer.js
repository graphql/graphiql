/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import {
  processStreamMessage,
  processIPCRequestMessage,
  processIPCNotificationMessage,
} from './MessageProcessor';

export default async function startServer(configDir: ?string): Promise<void> {
  // IPC protocol support
  // The language server protocol specifies that the client starts sending
  // messages when the server starts. Start listening from this point.
  process.on('message', message => {
    // TODO: support the header part of the language server protocol
    // Recognize the Content-Length header
    if (
      typeof message === 'string' &&
      message.indexOf('Content-Length') === 0
    ) {
      return;
    }

    if (message.id != null) {
      processIPCRequestMessage(message, configDir);
    } else {
      processIPCNotificationMessage(message);
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
}
