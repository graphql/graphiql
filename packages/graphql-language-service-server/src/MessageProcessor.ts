/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { readFileSync } from 'fs';
import { URL } from 'url';

import {
  CachedContent,
  GraphQLCache,
  Uri,
  FileChangeTypeKind,
  DefinitionQueryResult,
  GraphQLConfig,
} from 'graphql-language-service-types';

import { GraphQLLanguageService } from 'graphql-language-service-interface';

import { Range, Position } from 'graphql-language-service-utils';

import {
  CompletionParams,
  FileEvent,
  VersionedTextDocumentIdentifier,
  DidSaveTextDocumentParams,
  DidOpenTextDocumentParams,
} from 'vscode-languageserver-protocol';

import {
  Diagnostic,
  CompletionItem,
  CompletionList,
  CancellationToken,
  Hover,
  InitializeResult,
  Location,
  PublishDiagnosticsParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidChangeWatchedFilesParams,
  InitializeParams,
  Range as RangeType,
  TextDocumentPositionParams,
  DocumentSymbolParams,
  SymbolInformation,
} from 'vscode-languageserver';

import { getGraphQLCache } from './GraphQLCache';
import { parseDocument } from './parseDocument';

import { Logger } from './Logger';

type CachedDocumentType = {
  version: number;
  contents: CachedContent[];
};

export class MessageProcessor {
  _graphQLCache!: GraphQLCache;
  _graphQLConfig: GraphQLConfig | undefined;
  _languageService!: GraphQLLanguageService;
  _textDocumentCache: Map<string, CachedDocumentType>;
  _isInitialized: boolean;
  _willShutdown: boolean;
  _logger: Logger;
  _extensions?: Array<(config: GraphQLConfig) => GraphQLConfig>;
  _fileExtensions?: Array<string>;
  _parser: typeof parseDocument;

  constructor(
    logger: Logger,
    extensions?: Array<(config: GraphQLConfig) => GraphQLConfig>,
    config?: GraphQLConfig,
    parser?: typeof parseDocument,
    fileExtensions?: string[],
  ) {
    this._textDocumentCache = new Map();
    this._isInitialized = false;
    this._willShutdown = false;
    this._logger = logger;
    this._extensions = extensions;
    this._fileExtensions = fileExtensions;
    this._graphQLConfig = config;
    this._parser = parser || parseDocument;
  }

  async handleInitializeRequest(
    params: InitializeParams,
    _token?: CancellationToken,
    configDir?: string,
  ): Promise<InitializeResult> {
    if (!params) {
      throw new Error('`params` argument is required to initialize.');
    }

    const serverCapabilities: InitializeResult = {
      capabilities: {
        workspaceSymbolProvider: true,
        documentSymbolProvider: true,
        completionProvider: { resolveProvider: true },
        definitionProvider: true,
        textDocumentSync: 1,
        hoverProvider: true,
      },
    };

    const rootPath = configDir ? configDir.trim() : params.rootPath;
    if (!rootPath) {
      throw new Error(
        '`--configDir` option or `rootPath` argument is required.',
      );
    }

    this._graphQLCache = await getGraphQLCache(
      rootPath,
      this._extensions,
      this._graphQLConfig,
    );
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
    params: DidSaveTextDocumentParams | DidOpenTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    if (!this._isInitialized || !this._graphQLCache) {
      return null;
    }

    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }
    const { textDocument } = params;
    const { uri } = textDocument;

    const diagnostics: Diagnostic[] = [];

    let contents: CachedContent[] = [];
    // Create/modify the cached entry if text is provided.
    // Otherwise, try searching the cache to perform diagnostics.
    if ('text' in textDocument && textDocument.text) {
      // textDocument/didSave does not pass in the text content.
      // Only run the below function if text is passed in.
      contents = parseDocument(textDocument.text, uri, this._fileExtensions);

      this._invalidateCache(textDocument, uri, contents);
    } else {
      const cachedDocument = this._getCachedDocument(textDocument.uri);
      if (cachedDocument) {
        contents = cachedDocument.contents;
      }
    }

    await Promise.all(
      contents.map(async ({ query, range }) => {
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

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didOpen',
        projectName: project && project.name,
        fileName: uri,
      }),
    );

    return { uri, diagnostics };
  }

  async handleDidChangeNotification(
    params: DidChangeTextDocumentParams,
  ): Promise<PublishDiagnosticsParams | null> {
    if (!this._isInitialized || !this._graphQLCache) {
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
    const uri = textDocument.uri;

    // If it's a .js file, try parsing the contents to see if GraphQL queries
    // exist. If not found, delete from the cache.
    const contents = parseDocument(
      contentChange.text,
      uri,
      this._fileExtensions,
    );
    // If it's a .graphql file, proceed normally and invalidate the cache.
    this._invalidateCache(textDocument, uri, contents);

    const cachedDocument = this._getCachedDocument(uri);
    if (!cachedDocument) {
      return null;
    }

    this._updateFragmentDefinition(uri, contents);
    this._updateObjectTypeDefinition(uri, contents);

    // Send the diagnostics onChange as well
    const diagnostics: Diagnostic[] = [];
    await Promise.all(
      contents.map(async ({ query, range }) => {
        const results = await this._languageService.getDiagnostics(query, uri);
        if (results && results.length > 0) {
          diagnostics.push(...processDiagnosticsMessage(results, query, range));
        }
      }),
    );

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didChange',
        projectName: project && project.name,
        fileName: uri,
      }),
    );

    return { uri, diagnostics };
  }

  handleDidCloseNotification(params: DidCloseTextDocumentParams): void {
    if (!this._isInitialized || !this._graphQLCache) {
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

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/didClose',
        projectName: project && project.name,
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

  validateDocumentAndPosition(params: CompletionParams): void {
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
  }

  async handleCompletionRequest(
    params: CompletionParams,
  ): Promise<CompletionList | Array<CompletionItem>> {
    if (!this._isInitialized || !this._graphQLCache) {
      return [];
    }

    this.validateDocumentAndPosition(params);

    const textDocument = params.textDocument;
    const position = params.position;

    // `textDocument/completion` event takes advantage of the fact that
    // `textDocument/didChange` event always fires before, which would have
    // updated the cache with the query text from the editor.
    // Treat the computed list always complete.

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

    const { query, range } = found;

    if (range) {
      position.line -= range.start.line;
    }
    const result = await this._languageService.getAutocompleteSuggestions(
      query,
      position,
      textDocument.uri,
    );

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(textDocument.uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/completion',
        projectName: project && project.name,
        fileName: textDocument.uri,
      }),
    );

    return { items: result, isIncomplete: false };
  }

  async handleHoverRequest(params: TextDocumentPositionParams): Promise<Hover> {
    if (!this._isInitialized || !this._graphQLCache) {
      return { contents: [] };
    }

    this.validateDocumentAndPosition(params);

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
      return { contents: [] };
    }

    const { query, range } = found;

    if (range) {
      position.line -= range.start.line;
    }
    const result = await this._languageService.getHoverInformation(
      query,
      position,
      textDocument.uri,
    );

    return {
      contents: result,
    };
  }

  async handleWatchedFilesChangedNotification(
    params: DidChangeWatchedFilesParams,
  ): Promise<Array<PublishDiagnosticsParams | undefined> | null> {
    if (!this._isInitialized || !this._graphQLCache) {
      return null;
    }

    return Promise.all(
      params.changes.map(async (change: FileEvent) => {
        if (!this._isInitialized || !this._graphQLCache) {
          throw Error('No cache available for handleWatchedFilesChanged');
        }

        if (
          change.type === FileChangeTypeKind.Created ||
          change.type === FileChangeTypeKind.Changed
        ) {
          const uri = change.uri;
          const text: string = readFileSync(new URL(uri).pathname).toString();
          const contents = parseDocument(text, uri, this._fileExtensions);

          this._updateFragmentDefinition(uri, contents);
          this._updateObjectTypeDefinition(uri, contents);

          const diagnostics = (
            await Promise.all(
              contents.map(async ({ query, range }) => {
                const results = await this._languageService.getDiagnostics(
                  query,
                  uri,
                );
                if (results && results.length > 0) {
                  return processDiagnosticsMessage(results, query, range);
                } else {
                  return [];
                }
              }),
            )
          ).reduce((left, right) => left.concat(right));

          const project = this._graphQLCache
            .getGraphQLConfig()
            .getProjectForFile(uri);

          this._logger.log(
            JSON.stringify({
              type: 'usage',
              messageType: 'workspace/didChangeWatchedFiles',
              projectName: project && project.name,
              fileName: uri,
            }),
          );

          return { uri, diagnostics };
        } else if (change.type === FileChangeTypeKind.Deleted) {
          this._graphQLCache.updateFragmentDefinitionCache(
            this._graphQLCache.getGraphQLConfig().dirpath,
            change.uri,
            false,
          );
          this._graphQLCache.updateObjectTypeDefinitionCache(
            this._graphQLCache.getGraphQLConfig().dirpath,
            change.uri,
            false,
          );
        }
      }),
    );
  }

  async handleDefinitionRequest(
    params: TextDocumentPositionParams,
    _token?: CancellationToken,
  ): Promise<Array<Location>> {
    if (!this._isInitialized || !this._graphQLCache) {
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

    const { query, range } = found;
    if (range) {
      position.line -= range.start.line;
    }
    const result: DefinitionQueryResult | null = await this._languageService.getDefinition(
      query,
      position,
      textDocument.uri,
    );
    const formatted = result
      ? result.definitions.map(res => {
          const defRange = res.range as Range;
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

    const project = this._graphQLCache
      .getGraphQLConfig()
      .getProjectForFile(textDocument.uri);

    this._logger.log(
      JSON.stringify({
        type: 'usage',
        messageType: 'textDocument/definition',
        projectName: project && project.name,
        fileName: textDocument.uri,
      }),
    );
    return formatted;
  }

  async handleDocumentSymbolRequest(
    params: DocumentSymbolParams,
  ): Promise<Array<SymbolInformation>> {
    if (!this._isInitialized) {
      return [];
    }

    if (!params || !params.textDocument) {
      throw new Error('`textDocument` argument is required.');
    }

    const textDocument = params.textDocument;
    const cachedDocument = this._getCachedDocument(textDocument.uri);
    if (!cachedDocument) {
      throw new Error('A cached document cannot be found.');
    }
    return this._languageService.getDocumentSymbols(
      cachedDocument.contents[0].query,
      textDocument.uri,
    );
  }

  // async handleReferencesRequest(params: ReferenceParams): Promise<Location[]> {
  //    if (!this._isInitialized) {
  //      return [];
  //    }

  //    if (!params || !params.textDocument) {
  //      throw new Error('`textDocument` argument is required.');
  //    }

  //    const textDocument = params.textDocument;
  //    const cachedDocument = this._getCachedDocument(textDocument.uri);
  //    if (!cachedDocument) {
  //      throw new Error('A cached document cannot be found.');
  //    }
  //    return this._languageService.getReferences(
  //      cachedDocument.contents[0].query,
  //      params.position,
  //      textDocument.uri,
  //    );
  // }

  _isRelayCompatMode(query: string): boolean {
    return (
      query.indexOf('RelayCompat') !== -1 ||
      query.indexOf('react-relay/compat') !== -1
    );
  }

  async _updateFragmentDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const rootDir = this._graphQLCache.getGraphQLConfig().dirpath;

    await this._graphQLCache.updateFragmentDefinition(
      rootDir,
      new URL(uri).pathname,
      contents,
    );
  }

  async _updateObjectTypeDefinition(
    uri: Uri,
    contents: CachedContent[],
  ): Promise<void> {
    const rootDir = this._graphQLCache.getGraphQLConfig().dirpath;

    await this._graphQLCache.updateObjectTypeDefinition(
      rootDir,
      new URL(uri).pathname,
      contents,
    );
  }

  _getCachedDocument(uri: string): CachedDocumentType | null {
    if (this._textDocumentCache.has(uri)) {
      const cachedDocument = this._textDocumentCache.get(uri);
      if (cachedDocument) {
        return cachedDocument;
      }
    }

    return null;
  }
  _invalidateCache(
    textDocument: VersionedTextDocumentIdentifier,
    uri: Uri,
    contents: CachedContent[],
  ): void {
    if (this._textDocumentCache.has(uri)) {
      const cachedDocument = this._textDocumentCache.get(uri);
      if (
        cachedDocument &&
        textDocument.version &&
        cachedDocument.version < textDocument.version
      ) {
        // Current server capabilities specify the full sync of the contents.
        // Therefore always overwrite the entire content.
        this._textDocumentCache.set(uri, {
          version: textDocument.version,
          contents,
        });
      }
    } else if (textDocument.version) {
      this._textDocumentCache.set(uri, {
        version: textDocument.version,
        contents,
      });
    }
  }
}

function processDiagnosticsMessage(
  results: Diagnostic[],
  query: string,
  range: RangeType | null,
): Diagnostic[] {
  const queryLines = query.split('\n');
  const totalLines = queryLines.length;
  const lastLineLength = queryLines[totalLines - 1].length;
  const lastCharacterPosition = new Position(totalLines, lastLineLength);
  const processedResults = results.filter(diagnostic =>
    // @ts-ignore
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
