/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import path from 'path';

import type {GraphQLCache} from './GraphQLCache';
import {getGraphQLCache} from './GraphQLCache';

import {getOutline} from '../interfaces/getOutline';
import {GraphQLLanguageService} from '../interfaces/GraphQLLanguageService';

import {Point} from '../utils/Range';

// RPC message types
const ERROR_RESPONSE_MESSAGE = 'error-response';
const ERROR_MESSAGE = 'error';
const RESPONSE_MESSAGE = 'response';
const NEXT_MESSAGE = 'next';
const COMPLETE_MESSAGE = 'complete';

export default async function startServer(rawConfigDir: string): Promise<void> {
  const configDir = path.resolve(rawConfigDir);

  const graphQLCache = await getGraphQLCache(configDir || process.cwd());
  const languageService = new GraphQLLanguageService(graphQLCache);

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
    const flagPosition = data.indexOf('\n');
    if (flagPosition !== -1) {
      // There may be more than one message in the buffer.
      const messages = data.split('\n');
      data = messages.pop().trim();
      messages.forEach(message => processMessage(
        message,
        graphQLCache,
        languageService,
      ));
    }
  });
}

async function processMessage(
  message: string,
  graphQLCache: GraphQLCache,
  languageService: GraphQLLanguageService,
): Promise<void> {
  if (message.length === 0) {
    return;
  }

  let json;

  try {
    json = JSON.parse(message);
  } catch (error) {
    process.stdout.write(JSON.stringify(
      convertToRpcMessage(
        'error',
        '-1',
        'Request contains incorrect JSON format',
      ),
    ));
    return;
  }

  const {query, position, filePath} = json.args;
  const id = json.id;

  try {
    let result = null;
    let responseMsg = null;
    switch (json.method) {
      case 'disconnect':
        exitProcess(0);
        break;
      case 'getDiagnostics':
        result = await languageService.getDiagnostics(query, filePath);
        if (result && result.length > 0) {
          const queryLines = query.split('\n');
          const totalRows = queryLines.length;
          const lastLineLength = queryLines[totalRows - 1].length;
          const lastCharacterPoint = new Point(totalRows, lastLineLength);
          result = result.filter(diagnostic =>
            diagnostic.range.end.lessThanOrEqualTo(lastCharacterPoint),
          );
        }
        responseMsg = convertToRpcMessage(
          'response',
          id,
          result,
        );
        process.stdout.write(JSON.stringify(responseMsg) + '\n');
        break;
      case 'getDefinition':
        result = await languageService.getDefinition(query, position, filePath);
        responseMsg = convertToRpcMessage('response', id, result);
        process.stdout.write(JSON.stringify(responseMsg) + '\n');
        break;
      case 'getAutocompleteSuggestions':
        result = await languageService.getAutocompleteSuggestions(
          query,
          position,
          filePath,
        );

        const formatted = result.map(
          res => ({
            text: res.text,
            typeName: res.type ? String(res.type) : null,
            description: res.description || null,
          }),
        );
        responseMsg = convertToRpcMessage('response', id, formatted);
        process.stdout.write(JSON.stringify(responseMsg) + '\n');
        break;
      case 'getOutline':
        result = getOutline(query);
        responseMsg = convertToRpcMessage('response', id, result);
        process.stdout.write(JSON.stringify(responseMsg) + '\n');
        break;
      default:
        break;
    }
  } catch (error) {
    process.stdout.write(
      JSON.stringify(convertToRpcMessage('error', id, error.message)),
    );
  }
}

function exitProcess(exitCode) {
  process.exit(exitCode);
}

function convertToRpcMessage(
  type: string,
  id: string,
  response: any,
) {
  let responseObj;
  switch (type) {
    case RESPONSE_MESSAGE:
      responseObj = {result: response};
      break;
    case ERROR_MESSAGE:
    case ERROR_RESPONSE_MESSAGE:
      responseObj = {error: response};
      break;
    case NEXT_MESSAGE:
      responseObj = {value: response};
      break;
    case COMPLETE_MESSAGE:
      // Intentionally blank
      responseObj = {};
      break;
  }
  return {
    protocol: 'graphql_language_service',
    type,
    id,
    ...responseObj,
  };
}
