/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {Diagnostic, Uri} from 'graphql-language-service-types';
import {
  CompletionRequest,
  CompletionList,
  InitializeResult,
  Location,
  PublishDiagnosticsParams,
} from 'vscode-languageserver';

import {findGraphQLConfigDir} from 'graphql-language-service-config';
import {GraphQLLanguageService} from 'graphql-language-service-interface';
import {Position} from 'graphql-language-service-utils';
import path from 'path';
import {
  CancellationToken,
  NotificationMessage,
  RequestMessage,
  ServerCapabilities,
} from 'vscode-jsonrpc';

import {getGraphQLCache} from './GraphQLCache';

let graphQLCache;
let languageService;
const textDocumentCache: Map<string, Object> = new Map();

export async function handleDidOpenOrSaveNotification(
  params: NotificationMessage,
): Promise<PublishDiagnosticsParams> {
  if (!params || !params.textDocument) {
    throw new Error('`textDocument` argument is required.');
  }

  const textDocument = params.textDocument;
  const uri = textDocument.uri;

  let text = textDocument.text;

  // Create/modify the cached entry if text is provided.
  // Otherwise, try searching the cache to perform diagnostics.
  if (text) {
    invalidateCache(textDocument, uri, {text});
  } else {
    if (textDocumentCache.has(uri)) {
      const cachedDocument = textDocumentCache.get(uri);
      if (cachedDocument) {
        text = cachedDocument.content.text;
      }
    }
  }

  const diagnostics = await provideDiagnosticsMessage(text, uri);
  return {uri, diagnostics};
}

export async function handleDidChangeNotification(
  params: NotificationMessage,
): Promise<PublishDiagnosticsParams> {
  // For every `textDocument/didChange` event, keep a cache of textDocuments
  // with version information up-to-date, so that the textDocument contents
  // may be used during performing language service features,
  // e.g. autocompletions.
  if (!params || !params.textDocument || !params.contentChanges) {
    throw new Error(
      '`textDocument` and `contentChanges` arguments are required.',
    );
  }

  const textDocument = params.textDocument;
  const contentChanges = params.contentChanges;

  // As `contentChanges` is an array and we just want the
  // latest update to the text, grab the last entry from the array.
  const uri = textDocument.uri || params.uri;
  invalidateCache(textDocument, uri, contentChanges[contentChanges.length - 1]);

  const cachedDocument = textDocumentCache.get(uri);
  if (!cachedDocument) {
    return;
  }

  // Send the diagnostics onChange as well
  const diagnostics = await provideDiagnosticsMessage(
    cachedDocument.content.text,
    uri,
  );

  return {uri, diagnostics};
}

export async function handleDidCloseNotification(
  params: NotificationMessage,
): Promise<void> {
  // For every `textDocument/didClose` event, delete the cached entry.
  // This is to keep a low memory usage && switch the source of truth to
  // the file on disk.
  if (!params || !params.textDocument) {
    throw new Error('`textDocument` is required.');
  }
  const textDocument = params.textDocument;

  if (textDocumentCache.has(textDocument.uri)) {
    textDocumentCache.delete(textDocument.uri);
  }
}

export async function handleInitializeRequest(
  params: RequestMessage,
  token: CancellationToken,
  configDir?: string,
): Promise<InitializeResult.type> {
  if (!params || !params.rootPath) {
    throw new Error('`rootPath` argument is required.');
  }
  const serverCapabilities = await initialize(
    configDir ? configDir.trim() : params.rootPath,
  );

  if (!serverCapabilities) {
    throw new Error('GraphQL Language Server is not initialized.');
  }
  return serverCapabilities;
}

export async function handleCompletionRequest(
  params: CompletionRequest.type,
  token: CancellationToken,
): Promise<CompletionList> {
  // `textDocument/comletion` event takes advantage of the fact that
  // `textDocument/didChange` event always fires before, which would have
  // updated the cache with the query text from the editor.
  // Treat the computed list always complete.
  if (!params || !params.textDocument || !params.position) {
    throw new Error('`textDocument` argument is required.');
  }
  const textDocument = params.textDocument;
  const position = params.position;

  const cachedDocument = getCachedDocument(textDocument.uri);
  if (!cachedDocument) {
    throw new Error(`${textDocument.uri} is not available.`);
  }

  const query = cachedDocument.content.text;
  const result = await languageService.getAutocompleteSuggestions(
    query,
    position,
    textDocument.uri,
  );
  return {items: result, isIncomplete: false};
}

export async function handleDefinitionRequest(
  params: CompletionRequest.type,
  token: CancellationToken,
): Promise<Array<Location>> {
  if (!params || !params.textDocument || !params.position) {
    throw new Error('`textDocument` and `position` arguments are required.');
  }
  const textDocument = params.textDocument;
  const pos = params.position;

  const cachedDocument = getCachedDocument(textDocument.uri);
  if (!cachedDocument) {
    throw new Error(`${textDocument.uri} is not available.`);
  }

  const query = cachedDocument.content.text;
  const result = await languageService.getDefinition(
    query,
    pos,
    textDocument.uri,
  );
  const formatted = result
    ? result.definitions.map(res => ({
        // TODO: fix this hack!
        // URI is being misused all over this library - there's a link that
        // defines how an URI should be structured:
        // https://tools.ietf.org/html/rfc3986
        // Remove the below hack once the usage of URI is sorted out in related
        // libraries.
        uri: res.path.indexOf('file://') === 0
          ? res.path
          : path.join('file://', res.path),
        range: res.range,
      }))
    : [];
  return formatted;
}

/**
 * Helper functions to perform requested services from client/server.
 */

async function initialize(rootPath: Uri): Promise<?ServerCapabilities> {
  const serverCapabilities = {
    capabilities: {
      completionProvider: {resolveProvider: true},
      definitionProvider: true,
      textDocumentSync: 1,
    },
  };

  const configDir = findGraphQLConfigDir(rootPath);
  if (!configDir) {
    return null;
  }

  graphQLCache = await getGraphQLCache(configDir);
  languageService = new GraphQLLanguageService(graphQLCache);

  return serverCapabilities;
}

async function provideDiagnosticsMessage(
  query: string,
  uri: Uri,
): Promise<Array<Diagnostic>> {
  let results = await languageService.getDiagnostics(query, uri);
  if (results && results.length > 0) {
    const queryLines = query.split('\n');
    const totalLines = queryLines.length;
    const lastLineLength = queryLines[totalLines - 1].length;
    const lastCharacterPosition = new Position(totalLines, lastLineLength);
    results = results.filter(diagnostic =>
      diagnostic.range.end.lessThanOrEqualTo(lastCharacterPosition));
  }

  return results;
}

function invalidateCache(
  textDocument: Object,
  uri: Uri,
  content: Object,
): void {
  if (!uri) {
    return;
  }

  if (textDocumentCache.has(uri)) {
    const cachedDocument = textDocumentCache.get(uri);
    if (cachedDocument && cachedDocument.version < textDocument.version) {
      // Current server capabilities specify the full sync of the contents.
      // Therefore always overwrite the entire content.
      textDocumentCache.set(uri, {
        version: textDocument.version,
        content,
      });
    }
  } else {
    textDocumentCache.set(uri, {
      version: textDocument.version,
      content,
    });
  }
}

function getCachedDocument(uri: string): ?Object {
  if (textDocumentCache.has(uri)) {
    const cachedDocument = textDocumentCache.get(uri);
    if (cachedDocument) {
      return cachedDocument;
    }
  }

  return null;
}
