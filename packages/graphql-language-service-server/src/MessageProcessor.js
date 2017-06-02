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
import {GraphQLWatchman} from './GraphQLWatchman';

let graphQLCache;
let languageService;

// Map { uri => { query, range } }
type Content = {
  query: string,
  range: ?Range,
};

type CachedDocumentType = {
  version: number,
  contents: Array<Content>,
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

  let contents = getQueryAndRange(textDocument.text, textDocument.uri);

  const diagnostics = [];

  // Create/modify the cached entry if text is provided.
  // Otherwise, try searching the cache to perform diagnostics.
  if (textDocument.text || textDocument.text === '') {
    invalidateCache(textDocument, uri, contents);
  } else {
    const cachedDocument = getCachedDocument(uri);
    if (cachedDocument) {
      contents = cachedDocument.contents;
    }
  }

  await Promise.all(
    contents.map(async ({query, range}) =>
      diagnostics.push(
        ...(await provideDiagnosticsMessage(query, uri, range)),
      )),
  );
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

  // If it's a .js file, try parsing the contents to see if GraphQL queries
  // exist. If not found, delete from the cache.
  const contents = getQueryAndRange(contentChange.text, uri);

  // If it's a .graphql file, proceed normally and invalidate the cache.
  invalidateCache(textDocument, uri, contents);

  const cachedDocument = getCachedDocument(uri);
  if (!cachedDocument) {
    return null;
  }

  // Send the diagnostics onChange as well
  const diagnostics = [];
  await Promise.all(
    contents.map(async ({query, range}) =>
      diagnostics.push(
        ...(await provideDiagnosticsMessage(query, uri, range)),
      )),
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
  watchmanClient?: GraphQLWatchman,
): Promise<InitializeResult.type> {
  if (!params || !params.rootPath) {
    throw new Error('`rootPath` argument is required.');
  }
  const serverCapabilities = await initialize(
    configDir ? configDir.trim() : params.rootPath,
    watchmanClient,
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

  const found = cachedDocument.contents.find(content => {
    const currentRange = content.range;
    if (currentRange && currentRange.containsPosition(position)) {
      return true;
    }
  });

  if (!found) {
    throw new Error(
      `${textDocument.uri} cannot be found from previously opened files.`,
    );
  }

  const {query, range} = found;

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
  const position = params.position;

  const cachedDocument = getCachedDocument(textDocument.uri);
  if (!cachedDocument) {
    throw new Error(`${textDocument.uri} is not available.`);
  }

  const found = cachedDocument.contents.find(content => {
    const currentRange = content.range;
    if (currentRange && currentRange.containsPosition(position)) {
      return true;
    }
  });

  if (!found) {
    throw new Error(
      `${textDocument.uri} cannot be found from previously opened files.`,
    );
  }

  const {query, range} = found;
  if (range) {
    position.line -= range.start.line;
  }
  const result = await languageService.getDefinition(
    query,
    position,
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
export function getQueryAndRange(text: string, uri: string): Array<Content> {
  // Check if the text content includes a GraphQLV query.
  // If the text doesn't include GraphQL queries, do not proceed.
  if (extname(uri) === '.js') {
    return parseGraphQLQueryFromText(text);
  } else {
    const query = text;
    if (!query && query !== '') {
      return [];
    }
    const lines = query.split('\n');
    const range = new Range(
      new Position(0, 0),
      new Position(lines.length - 1, lines[lines.length - 1].length - 1),
    );
    return [{query, range}];
  }
}

function parseGraphQLQueryFromText(text: string): Array<Content> {
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
  const contents = [];
  traverse(ast, {
    TaggedTemplateExpression(path) {
      const node = path.node;
      const quasi = node.quasi;
      const tag = node.tag;
      if (tag.name === 'graphql' || tag.name === 'graphql.experimental') {
        const loc = path.node.loc;
        const query = quasi.quasis[0].value.raw;
        const range = new Range(
          new Position(loc.start.line - 1, loc.start.column),
          new Position(loc.end.line - 1, loc.end.column),
        );
        contents.push({query, range});
        return;
      }
    },
  });

  return contents;
}

/**
 * Helper functions to perform requested services from client/server.
 */

async function initialize(
  rootPath: Uri,
  watchmanClient?: GraphQLWatchman,
): Promise<?ServerCapabilities> {
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

  graphQLCache = await getGraphQLCache(configDir, watchmanClient);
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
      const offset = range.start;
      results = results.map(diagnostic => ({
        ...diagnostic,
        range: new Range(
          new Position(
            diagnostic.range.start.line + offset.line,
            diagnostic.range.start.character,
          ),
          new Position(
            diagnostic.range.end.line + offset.line,
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
  contents: Array<Content>,
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
        contents,
      });
    }
  } else {
    textDocumentCache.set(uri, {
      version: textDocument.version,
      contents,
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
