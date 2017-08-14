/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {
  CachedContent,
  Diagnostic,
  GraphQLCache,
  Uri,
  Range as RangeType,
} from 'graphql-language-service-types';

import {extname, dirname} from 'path';
import {URL} from 'url';
import {findGraphQLConfigFile} from 'graphql-config';
import {GraphQLLanguageService} from 'graphql-language-service-interface';
import {Position, Range} from 'graphql-language-service-utils';
import {
  CancellationToken,
  NotificationMessage,
  ServerCapabilities,
} from 'vscode-jsonrpc';
import {
  CompletionItem,
  CompletionRequest,
  CompletionList,
  DefinitionRequest,
  InitializeRequest,
  InitializeResult,
  Location,
  PublishDiagnosticsParams,
} from 'vscode-languageserver';

import {getGraphQLCache} from './GraphQLCache';
import {findGraphQLTags} from './findGraphQLTags';
import {Logger} from './Logger';

// Map { uri => { query, range } }

type CachedDocumentType = {
  version: number,
  contents: Array<CachedContent>,
};

export class MessageProcessor {
  _graphQLCache: GraphQLCache;
  _languageService: GraphQLLanguageService;
  _textDocumentCache: Map<string, CachedDocumentType>;

  _isInitialized: boolean;

  _willShutdown: boolean;

  _logger: Logger;

  constructor(logger: Logger): void {
    this._textDocumentCache = new Map();
    this._isInitialized = false;
    this._willShutdown = false;

    this._logger = logger;
  }

  async handleInitializeRequest(
    params: InitializeRequest.type,
    token: CancellationToken,
    configDir?: string,
  ): Promise<InitializeResult.type> {
    if (!params) {
      throw new Error('`params` argument is required to initialize.');
    }

    const serverCapabilities: ServerCapabilities = {
      capabilities: {
        completionProvider: {resolveProvider: true},
        definitionProvider: true,
        textDocumentSync: 1,
      },
    };

    const rootPath = dirname(
      findGraphQLConfigFile(configDir ? configDir.trim() : params.rootPath),
    );
    if (!rootPath) {
      throw new Error(
        '`--configDir` option or `rootPath` argument is required.',
      );
    }

    this._graphQLCache = await getGraphQLCache(rootPath);
    this._languageService = new GraphQLLanguageService(this._graphQLCache);

    if (!serverCapabilities) {
      throw new Error('GraphQL Language Server is not initialized.');
    }

    this._isInitialized = true;

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'initialize',
      }),
    );

    return serverCapabilities;
  }

  async handleDidOpenOrSaveNotification(
    params: NotificationMessage,
  ): Promise<PublishDiagnosticsParams> {
    if (!this._isInitialized) {
      return null;
    }

    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }

    const textDocument = params.textDocument;
    const {text, uri} = textDocument;

    const diagnostics = [];

    let contents = [];

    // Create/modify the cached entry if text is provided.
    // Otherwise, try searching the cache to perform diagnostics.
    if (text || text === '') {
      // textDocument/didSave does not pass in the text content.
      // Only run the below function if text is passed in.
      contents = getQueryAndRange(text, uri);
      this._invalidateCache(textDocument, uri, contents);
    } else {
      const cachedDocument = this._getCachedDocument(uri);
      if (cachedDocument) {
        contents = cachedDocument.contents;
      }
    }

    await Promise.all(
      contents.map(async ({query, range}) => {
        const results = await this._languageService.getDiagnostics(
          query,
          uri,
          this._isRelayCompatMode(query) ? false : true,
        );
        if (results && results.length > 0) {
          diagnostics.push(...processDiagnosticsMessage(results, query, range));
        }
      }),
    );

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didOpen',
        projectName: this._graphQLCache
          .getGraphQLConfig()
          .getProjectNameForFile(uri),
        fileName: uri,
      }),
    );

    return {uri, diagnostics};
  }

  async handleDidChangeNotification(
    params: NotificationMessage,
  ): Promise<PublishDiagnosticsParams> {
    if (!this._isInitialized) {
      return null;
    }
    // For every `textDocument/didChange` event, keep a cache of textDocuments
    // with version information up-to-date, so that the textDocument contents
    // may be used during performing language service features,
    // e.g. autocompletions.
    if (
      !params ||
      !params.textDocument ||
      !params.contentChanges ||
      !params.textDocument.uri
    ) {
      throw new Error(
        '`textDocument`, `textDocument.uri`, and `contentChanges` arguments are required.',
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
    this._invalidateCache(textDocument, uri, contents);

    const cachedDocument = this._getCachedDocument(uri);
    if (!cachedDocument) {
      return null;
    }

    this._updateFragmentDefinition(uri, contents);

    // Send the diagnostics onChange as well
    const diagnostics = [];
    await Promise.all(
      contents.map(async ({query, range}) => {
        const results = await this._languageService.getDiagnostics(query, uri);
        if (results && results.length > 0) {
          diagnostics.push(...processDiagnosticsMessage(results, query, range));
        }
      }),
    );

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didChange',
        projectName: this._graphQLCache
          .getGraphQLConfig()
          .getProjectNameForFile(uri),
        fileName: uri,
      }),
    );

    return {uri, diagnostics};
  }

  handleDidCloseNotification(params: NotificationMessage): void {
    if (!this._isInitialized) {
      return;
    }
    // For every `textDocument/didClose` event, delete the cached entry.
    // This is to keep a low memory usage && switch the source of truth to
    // the file on disk.
    if (!params || !params.textDocument) {
      throw new Error('`textDocument` is required.');
    }
    const textDocument = params.textDocument;
    const uri = textDocument.uri;

    if (this._textDocumentCache.has(uri)) {
      this._textDocumentCache.delete(uri);
    }

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didClose',
        projectName: this._graphQLCache
          .getGraphQLConfig()
          .getProjectNameForFile(uri),
        fileName: uri,
      }),
    );
  }

  handleShutdownRequest(): void {
    this._willShutdown = true;
    return;
  }

  handleExitNotification(): void {
    process.exit(this._willShutdown ? 0 : 1);
  }

  async handleCompletionRequest(
    params: CompletionRequest.type,
    token: CancellationToken,
  ): Promise<CompletionList | Array<CompletionItem>> {
    if (!this._isInitialized) {
      return [];
    }
    // `textDocument/comletion` event takes advantage of the fact that
    // `textDocument/didChange` event always fires before, which would have
    // updated the cache with the query text from the editor.
    // Treat the computed list always complete.
    if (
      !params ||
      !params.textDocument ||
      !params.textDocument.uri ||
      !params.position
    ) {
      throw new Error(
        '`textDocument`, `textDocument.uri`, and `position` arguments are required.',
      );
    }

    const textDocument = params.textDocument;
    const position = params.position;

    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      throw new Error('A cached document cannot be found.');
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange && currentRange.containsPosition(position)) {
        return true;
      }
    });

    // If there is no GraphQL query in this file, return an empty result.
    if (!found) {
      return [];
    }

    const {query, range} = found;

    if (range) {
      position.line -= range.start.line;
    }
    const result = await this._languageService.getAutocompleteSuggestions(
      query,
      position,
      textDocument.uri,
    );

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/completion',
        projectName: this._graphQLCache
          .getGraphQLConfig()
          .getProjectNameForFile(textDocument.uri),
        fileName: textDocument.uri,
      }),
    );

    return {items: result, isIncomplete: false};
  }

  async handleDefinitionRequest(
    params: DefinitionRequest.type,
    token: CancellationToken,
  ): Promise<Array<Location>> {
    if (!this._isInitialized) {
      return [];
    }

    if (!params || !params.textDocument || !params.position) {
      throw new Error('`textDocument` and `position` arguments are required.');
    }
    const textDocument = params.textDocument;
    const position = params.position;

    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      throw new Error(`${textDocument.uri} is not available.`);
    }

    const found = cachedDocument.contents.find(content => {
      const currentRange = content.range;
      if (currentRange && currentRange.containsPosition(position)) {
        return true;
      }
    });

    // If there is no GraphQL query in this file, return an empty result.
    if (!found) {
      return [];
    }

    const {query, range} = found;
    if (range) {
      position.line -= range.start.line;
    }
    const result = await this._languageService.getDefinition(
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
            uri:
              res.path.indexOf('file://') === 0
                ? res.path
                : `file://${res.path}`,
            range: defRange,
          };
        })
      : [];

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/definition',
        projectName: this._graphQLCache
          .getGraphQLConfig()
          .getProjectNameForFile(textDocument.uri),
        fileName: textDocument.uri,
      }),
    );
    return formatted;
  }

  _isRelayCompatMode(query: string): boolean {
    return (
      query.indexOf('RelayCompat') !== -1 ||
      query.indexOf('react-relay/compat') !== -1
    );
  }

  async _updateFragmentDefinition(
    uri: Uri,
    contents: Array<CachedContent>,
  ): Promise<void> {
    const rootDir = this._graphQLCache.getGraphQLConfig().rootDir;

    await this._graphQLCache.updateFragmentDefinition(
      rootDir,
      new URL(uri).pathname,
      contents,
    );
  }

  _getCachedDocument(uri: string): ?CachedDocumentType {
    if (this._textDocumentCache.has(uri)) {
      const cachedDocument = this._textDocumentCache.get(uri);
      if (cachedDocument) {
        return cachedDocument;
      }
    }

    return null;
  }

  _invalidateCache(
    textDocument: Object,
    uri: Uri,
    contents: Array<CachedContent>,
  ): void {
    if (this._textDocumentCache.has(uri)) {
      const cachedDocument = this._textDocumentCache.get(uri);
      if (cachedDocument && cachedDocument.version < textDocument.version) {
        // Current server capabilities specify the full sync of the contents.
        // Therefore always overwrite the entire content.
        this._textDocumentCache.set(uri, {
          version: textDocument.version,
          contents,
        });
      }
    } else {
      this._textDocumentCache.set(uri, {
        version: textDocument.version,
        contents,
      });
    }
  }
}

/**
 * Helper functions to perform requested services from client/server.
 */

// Check the uri to determine the file type (JavaScript/GraphQL).
// If .js file, either return the parsed query/range or null if GraphQL queries
// are not found.
export function getQueryAndRange(
  text: string,
  uri: string,
): Array<CachedContent> {
  // Check if the text content includes a GraphQLV query.
  // If the text doesn't include GraphQL queries, do not proceed.
  if (extname(uri) === '.js') {
    if (
      text.indexOf('graphql`') === -1 &&
      text.indexOf('graphql.experimental`') === -1
    ) {
      return [];
    }
    const templates = findGraphQLTags(text);
    return templates.map(({template, range}) => ({query: template, range}));
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

function processDiagnosticsMessage(
  results: Array<Diagnostic>,
  query: string,
  range: ?RangeType,
): Array<Diagnostic> {
  const queryLines = query.split('\n');
  const totalLines = queryLines.length;
  const lastLineLength = queryLines[totalLines - 1].length;
  const lastCharacterPosition = new Position(totalLines, lastLineLength);
  const processedResults = results.filter(diagnostic =>
    diagnostic.range.end.lessThanOrEqualTo(lastCharacterPosition),
  );

  if (range) {
    const offset = range.start;
    return processedResults.map(diagnostic => ({
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

  return processedResults;
}
