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
import {parse as babylonParse} from 'babylon';
import traverse from 'babel-traverse';

import {extname} from 'path';
import {findGraphQLConfigDir} from 'graphql-language-service-config';
import {GraphQLLanguageService} from 'graphql-language-service-interface';
import {Position, Range} from 'graphql-language-service-utils';
import {
  CancellationToken,
  NotificationMessage,
  RequestMessage,
  ServerCapabilities,
} from 'vscode-jsonrpc';
import {
  CompletionRequest,
  CompletionList,
  InitializeResult,
  Location,
  PublishDiagnosticsParams,
} from 'vscode-languageserver';

import {getGraphQLCache} from './GraphQLCache';

let graphQLCache;
let languageService;

// Map { uri => { query, range } }
type Content = {
  query: string,
  range: ?Range,
};

type CachedDocumentType = {
  version: number,
  content: Content,
};

const textDocumentCache: Map<string, CachedDocumentType> = new Map();

export async function handleDidOpenOrSaveNotification(
  params: NotificationMessage,
): Promise<PublishDiagnosticsParams> {
  if (!params || !params.textDocument) {
    throw new Error('`textDocument` argument is required.');
  }

  const textDocument = params.textDocument;
  const uri = textDocument.uri;

  const content = getQueryAndRange(textDocument.text, textDocument.uri);
  if (!content) {
    // If the text doesn't include GraphQL queries, do not proceed.
    return null;
  }
  let query = content.query;
  const range = content.range;

  // Create/modify the cached entry if text is provided.
  // Otherwise, try searching the cache to perform diagnostics.
  if (query) {
    invalidateCache(textDocument, uri, {query, range});
  } else {
    const cachedDocument = getCachedDocument(uri);
    if (cachedDocument) {
      query = cachedDocument.content.query;
    }
  }

  const diagnostics = await provideDiagnosticsMessage(query, uri, range);
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
  const contentChange = contentChanges[contentChanges.length - 1];

  // As `contentChanges` is an array and we just want the
  // latest update to the text, grab the last entry from the array.
  const uri = textDocument.uri || params.uri;

  const content = getQueryAndRange(contentChange.text, contentChange.uri);
  if (!content) {
    // If it's a .js file, try parsing the contents to see if GraphQL queries
    // exist. If not found, delete from the cache.
    return null;
  }
  // If it's a .graphql file, proceed normally and invalidate the cache.
  invalidateCache(textDocument, uri, {...content});

  const cachedDocument = getCachedDocument(uri);
  if (!cachedDocument) {
    return null;
  }

  const {query, range} = cachedDocument.content;
  if (!query || !range) {
    return null;
  }

  // Send the diagnostics onChange as well
  const diagnostics = await provideDiagnosticsMessage(query, uri, range);

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

  const {query, range} = cachedDocument.content;
  if (range) {
    position.line -= range.start.line;
  }
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

  const {query, range} = cachedDocument.content;
  if (range) {
    pos.line -= range.start.line;
  }
  const result = await languageService.getDefinition(
    query,
    pos,
    textDocument.uri,
  );
  const formatted = result
    ? result.definitions.map(res => {
        const defRange = res.range;
        return {
          // TODO: fix this hack!
          // URI is being misused all over this library - there's a link that
          // defines how an URI should be structured:
          // https://tools.ietf.org/html/rfc3986
          // Remove the below hack once the usage of URI is sorted out in related
          // libraries.
          uri: res.path.indexOf('file://') === 0
            ? res.path
            : `file://${res.path}`,
          range: defRange,
        };
      })
    : [];
  return formatted;
}

// Check the uri to determine the file type (JavaScript/GraphQL).
// If .js file, either return the parsed query/range or null if GraphQL queries
// are not found.
export function getQueryAndRange(text: string, uri: string): Content | null {
  let query;
  let range;
  // Check if the text content includes a GraphQLV query.
  // If the text doesn't include GraphQL queries, do not proceed.
  if (extname(uri) === '.js') {
    const parsed = parseGraphQLQueryFromText(text);
    if (!parsed) {
      return null;
    }
    query = parsed.query;
    range = parsed.range;
  } else {
    query = text;
    if (query) {
      const lines = query.split('\n');
      range = new Range(
        new Position(0, 0),
        new Position(lines.length - 1, lines[lines.length - 1].length - 1),
      );
    }
  }

  return {query, range};
}

function parseGraphQLQueryFromText(text: string): Content | null {
  const ast = babylonParse(text, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow',
      'doExpressions',
      'objectRestSpread',
      'classProperties',
      'exportExtensions',
      'asyncGenerators',
      'functionBind',
      'functionSent',
      'dynamicImport',
    ],
  });
  let query;
  let range;
  traverse(ast, {
    TaggedTemplateExpression(path) {
      const node = path.node;
      const quasi = node.quasi;
      const tag = node.tag;
      if (tag.name === 'graphql' || tag.name === 'graphql.experimental') {
        const loc = path.node.loc;
        query = quasi.quasis[0].value.raw;
        range = new Range(
          new Position(loc.start.line - 1, loc.start.character),
          new Position(loc.end.line - 1, loc.end.character),
        );
        return;
      }
    },
  });

  return query ? {query, range} : null;
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
  range: ?Range,
): Promise<Array<Diagnostic>> {
  let results = await languageService.getDiagnostics(query, uri);
  if (results && results.length > 0) {
    const queryLines = query.split('\n');
    const totalLines = queryLines.length;
    const lastLineLength = queryLines[totalLines - 1].length;
    const lastCharacterPosition = new Position(totalLines, lastLineLength);
    results = results.filter(diagnostic =>
      diagnostic.range.end.lessThanOrEqualTo(lastCharacterPosition));

    if (range) {
      results = results.map(diagnostic => ({
        ...diagnostic,
        range: new Range(
          new Position(
            diagnostic.range.start.line + range.start.line,
            diagnostic.range.start.character,
          ),
          new Position(
            diagnostic.range.end.line + range.end.line,
            diagnostic.range.end.character,
          ),
        ),
      }));
    }
  }

  return results;
}

function invalidateCache(
  textDocument: Object,
  uri: Uri,
  content: Content,
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

function getCachedDocument(uri: string): ?CachedDocumentType {
  if (textDocumentCache.has(uri)) {
    const cachedDocument = textDocumentCache.get(uri);
    if (cachedDocument) {
      return cachedDocument;
    }
  }

  return null;
}
