/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
import { SymbolKind } from 'vscode-languageserver';
import { FileChangeType } from 'vscode-languageserver-protocol';
import { Position, Range } from 'graphql-language-service';

import {
  MessageProcessor,
  processDiagnosticsMessage,
} from '../MessageProcessor';
import { parseDocument } from '../parseDocument';

jest.mock('../Logger');

jest.setTimeout(20000);

import { GraphQLCache } from '../GraphQLCache';

import {
  ConfigInvalidError,
  ConfigNotFoundError,
  LoaderNoResultError,
  ProjectNotFoundError,
  loadConfig,
} from 'graphql-config';

import type { DefinitionQueryResult, Outline } from 'graphql-language-service';

import { NoopLogger } from '../Logger';
import { pathToFileURL } from 'node:url';
import mockfs from 'mock-fs';
import { join } from 'node:path';

jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  readFileSync: jest.fn(jest.requireActual('fs').readFileSync),
}));

describe('MessageProcessor', () => {
  const logger = new NoopLogger();
  const messageProcessor = new MessageProcessor({
    // @ts-ignore
    connection: {},
    logger,
    graphqlFileExtensions: ['graphql'],
    loadConfigOptions: { rootDir: __dirname },
    config: null,
  });

  const queryPathUri = pathToFileURL(`${__dirname}/__queries__`);
  const textDocumentTestString = `
  {
    hero(episode: NEWHOPE){
    }
  }
  `;
  let gqlConfig;
  beforeEach(async () => {
    gqlConfig = await loadConfig({ rootDir: __dirname, extensions: [] });

    // loadConfig.mockRestore();
    messageProcessor._settings = { load: {} };
    messageProcessor._graphQLCache = new GraphQLCache({
      configDir: __dirname,
      config: gqlConfig,
      parser: parseDocument,
      logger: new NoopLogger(),
    });
    messageProcessor._languageService = {
      // @ts-ignore
      getAutocompleteSuggestions(query, position, uri) {
        return [{ label: `${query} at ${uri}` }];
      },
      // @ts-ignore
      getDiagnostics(_query, _uri) {
        return [];
      },
      async getHoverInformation(_query, position, _uri) {
        return {
          contents: '```graphql\nField: hero\n```',
          range: new Range(position, position),
        };
      },
      async getDocumentSymbols(_query: string, uri: string) {
        return [
          {
            name: 'item',
            kind: SymbolKind.Field,
            location: {
              uri,
              range: {
                start: { line: 1, character: 2 },
                end: { line: 1, character: 4 },
              },
            },
          },
        ];
      },
      async getOutline(_query: string): Promise<Outline> {
        return {
          outlineTrees: [
            {
              representativeName: 'item',
              kind: 'Field',
              startPosition: new Position(1, 2),
              endPosition: new Position(1, 4),
              children: [],
            },
          ],
        };
      },
      async getDefinition(
        _query,
        position,
        uri,
      ): Promise<DefinitionQueryResult> {
        return {
          queryRange: [new Range(position, position)],
          printedName: 'example',
          definitions: [
            {
              position,
              path: uri,
            },
          ],
        };
      },
    };
  });

  let getConfigurationReturnValue = {};
  // @ts-ignore
  messageProcessor._connection = {
    // @ts-ignore
    get workspace() {
      return {
        async getConfiguration() {
          return [getConfigurationReturnValue];
        },
      };
    },
  };

  const initialDocument = {
    textDocument: {
      text: textDocumentTestString,
      uri: `${queryPathUri}/test.graphql`,
      version: 0,
    },
  };

  messageProcessor._isInitialized = true;

  it('initializes properly and opens a file', async () => {
    const { capabilities } = await messageProcessor.handleInitializeRequest(
      // @ts-ignore
      {
        rootPath: __dirname,
      },
      null,
      __dirname,
    );
    expect(capabilities.definitionProvider).toEqual(true);
    expect(capabilities.workspaceSymbolProvider).toEqual(true);
    expect(capabilities.completionProvider.resolveProvider).toEqual(true);
    expect(capabilities.textDocumentSync).toEqual(1);
  });
  it('detects a config file', async () => {
    const result =
      await messageProcessor._isGraphQLConfigFile('graphql.config.js');
    expect(result).toEqual(true);
    const falseResult =
      await messageProcessor._isGraphQLConfigFile('graphql.js');
    expect(falseResult).toEqual(false);

    mockfs({ [`${__dirname}/package.json`]: '{"graphql": {}}' });
    const pkgResult = await messageProcessor._isGraphQLConfigFile(
      `file://${__dirname}/package.json`,
    );
    mockfs.restore();
    expect(pkgResult).toEqual(true);

    mockfs({ [`${__dirname}/package.json`]: '{ }' });
    const pkgFalseResult = await messageProcessor._isGraphQLConfigFile(
      `file://${__dirname}/package.json`,
    );
    mockfs.restore();
    expect(pkgFalseResult).toEqual(false);
  });
  it('runs completion requests properly', async () => {
    const uri = `${queryPathUri}/test2.graphql`;
    const query = 'test';
    messageProcessor._textDocumentCache.set(uri, {
      version: 0,
      contents: [
        {
          query,
          range: new Range(new Position(0, 0), new Position(0, 0)),
        },
      ],
    });

    const test = {
      position: new Position(0, 0),
      textDocument: { uri },
    };
    const result = await messageProcessor.handleCompletionRequest(test);
    expect(result).toEqual({
      items: [{ label: `${query} at ${uri}` }],
      isIncomplete: false,
    });
  });
  it('runs completion requests properly with no file present', async () => {
    const test = {
      position: new Position(0, 0),
      textDocument: { uri: `${queryPathUri}/test13.graphql` },
    };
    const result = await messageProcessor.handleCompletionRequest(test);
    expect(result).toEqual({
      items: [],
      isIncomplete: false,
    });
  });
  it('runs completion requests properly when not initialized', async () => {
    const test = {
      position: new Position(0, 3),
      textDocument: { uri: `${queryPathUri}/test2.graphql` },
    };
    messageProcessor._isInitialized = false;
    const result = await messageProcessor.handleCompletionRequest(test);
    expect(result).toEqual({
      items: [],
      isIncomplete: false,
    });
  });

  it('runs document symbol requests', async () => {
    messageProcessor._isInitialized = true;
    const uri = `${queryPathUri}/test3.graphql`;
    const validQuery = `
  {
    hero(episode: EMPIRE){
      ...testFragment
    }
  }
  `;

    const newDocument = {
      textDocument: {
        text: validQuery,
        uri,
        version: 0,
      },
    };

    messageProcessor._textDocumentCache.set(uri, {
      version: 0,
      contents: [
        {
          query: validQuery,
          range: new Range(new Position(0, 0), new Position(0, 0)),
        },
      ],
    });

    const test = {
      textDocument: newDocument.textDocument,
    };

    const result = await messageProcessor.handleDocumentSymbolRequest(test);

    expect(result).not.toBeUndefined();
    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual('item');
    expect(result[0].kind).toEqual(SymbolKind.Field);
    expect(result[0].location.range).toEqual({
      start: { line: 1, character: 2 },
      end: { line: 1, character: 4 },
    });
  });
  it('runs document symbol requests with no file present', async () => {
    const test = {
      textDocument: {
        uri: `${queryPathUri}/test4.graphql`,
        version: 0,
      },
    };

    const result = await messageProcessor.handleDocumentSymbolRequest(test);
    expect(result).toEqual([]);
  });
  it('runs document symbol requests when not initialized', async () => {
    const test = {
      textDocument: {
        uri: `${queryPathUri}/test3.graphql`,
        version: 0,
      },
    };
    messageProcessor._isInitialized = false;
    const result = await messageProcessor.handleDocumentSymbolRequest(test);
    expect(result).toEqual([]);
    messageProcessor._isInitialized = true;
    const nextResult = await messageProcessor.handleDocumentSymbolRequest(test);
    expect(nextResult[0].location.uri).toContain('test3.graphql');
    expect(nextResult[0].name).toEqual('item');
    expect(nextResult.length).toEqual(1);
  });

  it('properly changes the file cache with the didChange handler', async () => {
    const uri = `${queryPathUri}/test.graphql`;
    messageProcessor._textDocumentCache.set(uri, {
      version: 1,
      contents: [
        {
          query: '',
          range: new Range(new Position(0, 0), new Position(0, 0)),
        },
      ],
    });
    const textDocumentChangedString = `
      {
        hero(episode: NEWHOPE){
          name
        }
      }
      `;

    const result = await messageProcessor.handleDidChangeNotification({
      textDocument: {
        // @ts-ignore
        text: textDocumentTestString,
        uri,
        version: 1,
      },
      contentChanges: [
        { text: textDocumentTestString },
        { text: textDocumentChangedString },
      ],
    });
    // Query fixed, no more errors
    expect(result.diagnostics.length).toEqual(0);
  });

  it('does not crash on null value returned in response to workspace configuration', async () => {
    // for some reason this is needed? can't be a good thing... must have done something to cause a performance hit on
    // loading config schema..
    jest.setTimeout(10000);
    const previousConfigurationValue = getConfigurationReturnValue;
    getConfigurationReturnValue = null;
    const result = await messageProcessor.handleDidChangeConfiguration({});
    expect(result).toEqual({});
    getConfigurationReturnValue = previousConfigurationValue;
  });

  it('properly removes from the file cache with the didClose handler', async () => {
    await messageProcessor.handleDidCloseNotification(initialDocument);

    const position = { line: 4, character: 5 };
    const params = { textDocument: initialDocument.textDocument, position };

    // Should throw because file has been deleted from cache
    try {
      const result = await messageProcessor.handleCompletionRequest(params);
      expect(result).toEqual(null);
    } catch {}
  });

  // modified to work with jest.mock() of WatchmanClient
  it('runs definition requests', async () => {
    jest.setTimeout(10000);
    const validQuery = `
  {
    hero(episode: EMPIRE){
      ...testFragment
    }
  }
  `;

    const newDocument = {
      textDocument: {
        text: validQuery,
        uri: `${queryPathUri}/test3.graphql`,
        version: 1,
      },
    };
    messageProcessor._getCachedDocument = (_uri: string) => ({
      version: 1,
      contents: [
        {
          query: validQuery,
          range: new Range(new Position(0, 0), new Position(20, 4)),
        },
      ],
    });

    await messageProcessor.handleDidOpenOrSaveNotification(newDocument);

    const test = {
      position: new Position(3, 15),
      textDocument: newDocument.textDocument,
    };

    const result = await messageProcessor.handleDefinitionRequest(test);
    await expect(result[0].uri).toEqual(`${queryPathUri}/test3.graphql`);
  });

  it('retrieves custom results from locateCommand', async () => {
    jest.setTimeout(10000);
    const validQuery = `
  {
    hero(episode: EMPIRE){
      ...testFragment
    }
  }
  `;

    const newDocument = {
      textDocument: {
        text: validQuery,
        uri: `${queryPathUri}/test3.graphql`,
        version: 1,
      },
    };
    messageProcessor._getCachedDocument = (_uri: string) => ({
      version: 1,
      contents: [
        {
          query: validQuery,
          range: new Range(new Position(0, 0), new Position(20, 4)),
        },
      ],
    });

    await messageProcessor.handleDidOpenOrSaveNotification(newDocument);

    const test = {
      position: new Position(3, 15),
      textDocument: newDocument.textDocument,
    };
    const result = await messageProcessor._languageService.getDefinition(
      validQuery,
      test.position,
      test.textDocument.uri,
    );
    const project = messageProcessor._graphQLCache.getProjectForFile(
      test.textDocument.uri,
    );

    const customResult = messageProcessor._getCustomLocateResult(
      project,
      { definitions: result, printedName: 'example' },
      () => 'hello',
    );
    expect(customResult.uri).toEqual('hello');

    const customResult2 = messageProcessor._getCustomLocateResult(
      project,
      { definitions: result, printedName: 'example' },
      () => 'hello:2:4',
    );
    expect(customResult2.uri).toEqual('hello');
    expect(customResult2.range.start.line).toEqual(2);
    expect(customResult2.range.start.character).toEqual(0);
    expect(customResult2.range.end.line).toEqual(4);

    const customResult3 = messageProcessor._getCustomLocateResult(
      project,
      { definitions: result, printedName: 'example' },
      () => ({
        uri: 'hello1',
        range: {
          start: { character: 2, line: 2 },
          end: { character: 4, line: 4 },
        },
      }),
    );
    expect(customResult3.uri).toEqual('hello1');
    expect(customResult3.range.start.line).toEqual(2);
    expect(customResult3.range.start.character).toEqual(2);
    expect(customResult3.range.end.line).toEqual(4);
    expect(customResult3.range.end.character).toEqual(4);
    const oldGetProject = messageProcessor._graphQLCache.getProjectForFile;

    messageProcessor._graphQLCache.getProjectForFile = jest.fn(() => ({
      schema: project.schema,
      documents: project.documents,
      dirpath: project.dirpath,
      extensions: {
        languageService: { locateCommand: () => 'foo:3:4' },
      },
    }));
    const result2 = await messageProcessor.handleDefinitionRequest(test);
    expect(result2[0].range.start.line).toBe(3);
    expect(result2[0].range.end.line).toBe(4);
    expect(result2[0].range.end.character).toBe(0);
    messageProcessor._graphQLCache.getProjectForFile = oldGetProject;
  });
  it('runs hover requests', async () => {
    const validQuery = `
  {
    hero(episode: EMPIRE){
      ...testFragment
    }
  }
  `;

    const newDocument = {
      textDocument: {
        text: validQuery,
        uri: `${queryPathUri}/test4.graphql`,
        version: 1,
      },
    };
    messageProcessor._getCachedDocument = (_uri: string) => ({
      version: 1,
      contents: [
        {
          query: validQuery,
          range: new Range(new Position(0, 0), new Position(20, 4)),
        },
      ],
    });

    await messageProcessor.handleDidOpenOrSaveNotification(newDocument);

    const test = {
      position: new Position(3, 15),
      textDocument: newDocument.textDocument,
    };

    const result = await messageProcessor.handleHoverRequest(test);
    expect(JSON.stringify(result.contents)).toEqual(
      JSON.stringify({
        contents: '```graphql\nField: hero\n```',
        range: new Range(new Position(3, 15), new Position(3, 15)),
      }),
    );
  });
  it('runs hover request with no file present', async () => {
    const test = {
      position: new Position(3, 15),
      textDocument: {
        uri: `${queryPathUri}/test5.graphql`,
        version: 1,
      },
    };
    messageProcessor._getCachedDocument = (_uri: string) => null;

    const result = await messageProcessor.handleHoverRequest(test);
    expect(result).toEqual({ contents: [] });
  });
  it('handles provided config', async () => {
    const msgProcessor = new MessageProcessor({
      // @ts-ignore
      connection: {
        workspace: {
          getConfiguration() {
            return {};
          },
        },
      },
      logger,
      graphqlFileExtensions: ['graphql'],
      loadConfigOptions: { rootDir: __dirname },
      config: gqlConfig,
    });
    expect(msgProcessor._providedConfig).toBeTruthy();
    await msgProcessor.handleInitializeRequest(
      // @ts-ignore
      {
        rootPath: __dirname,
      },
      null,
      __dirname,
    );
    await msgProcessor.handleDidChangeConfiguration({
      settings: {},
    });
    expect(msgProcessor._graphQLCache).toBeTruthy();
  });

  it('runs workspace symbol requests', async () => {
    const msgProcessor = new MessageProcessor({
      // @ts-ignore
      connection: {},
      logger,
      graphqlFileExtensions: ['graphql'],
      loadConfigOptions: { rootDir: __dirname },
    });
    await msgProcessor.handleInitializeRequest(
      // @ts-ignore
      {
        rootPath: __dirname,
      },
      null,
      __dirname,
    );
    const uri = `${queryPathUri}/test6.graphql`;
    const docUri = `${queryPathUri}/test7.graphql`;
    const validQuery = `
  {
    hero(episode: EMPIRE){
      ...testFragment
    }
  }
  `;
    const validDocument = `
  fragment testFragment on Character {
    name
    }`;
    msgProcessor._graphQLCache = new GraphQLCache({
      configDir: __dirname,
      config: await loadConfig({ rootDir: __dirname }),
      parser: parseDocument,
      logger: new NoopLogger(),
    });
    msgProcessor._languageService = {
      getDocumentSymbols: async () => [
        {
          name: 'testFragment',
          kind: SymbolKind.Field,
          location: {
            uri,
            range: {
              start: { line: 1, character: 2 },
              end: { line: 1, character: 4 },
            },
          },
        },
      ],
    };
    msgProcessor._isInitialized = true;
    msgProcessor._textDocumentCache.set(uri, {
      version: 0,
      contents: [
        {
          query: validQuery,
          range: new Range(new Position(0, 0), new Position(6, 0)),
        },
      ],
    });

    await msgProcessor._graphQLCache.updateFragmentDefinition(
      __dirname,
      docUri,
      [
        {
          query: validDocument,
          range: new Range(new Position(0, 0), new Position(4, 0)),
        },
      ],
    );

    const test = {
      query: 'testFragment',
    };

    const result = await msgProcessor.handleWorkspaceSymbolRequest(test);
    expect(result).not.toBeUndefined();
    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual('testFragment');
    expect(result[0].kind).toEqual(SymbolKind.Field);
    expect(result[0].location.range).toEqual({
      start: { line: 1, character: 2 },
      end: { line: 1, character: 4 },
    });
  });

  describe('_loadConfigOrSkip', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('');
      messageProcessor._initializeGraphQLCaches = jest.fn();
    });

    it('loads config if not initialized', async () => {
      messageProcessor._isInitialized = false;

      const result = await messageProcessor._loadConfigOrSkip(
        `${pathToFileURL('.')}/graphql.config.js`,
      );
      expect(messageProcessor._initializeGraphQLCaches).toHaveBeenCalledTimes(
        1,
      );
      // we want to return true here to skip further processing, because it's just a config file change
      expect(result).toEqual(true);
    });

    it('loads config if a file change occurs and the server is not initialized', async () => {
      messageProcessor._isInitialized = false;

      const result = await messageProcessor._loadConfigOrSkip(
        `${pathToFileURL('.')}/file.ts`,
      );
      expect(messageProcessor._initializeGraphQLCaches).toHaveBeenCalledTimes(
        1,
      );
      // here we have a non-config file, so we don't want to skip, because we need to run diagnostics etc
      expect(result).toEqual(false);
    });
    it('config file change updates server config even if the server is already initialized', async () => {
      messageProcessor._isInitialized = true;
      const result = await messageProcessor._loadConfigOrSkip(
        `${pathToFileURL('.')}/graphql.config.ts`,
      );
      expect(messageProcessor._initializeGraphQLCaches).toHaveBeenCalledTimes(
        1,
      );
      expect(result).toEqual(true);
    });
    it('skips if the server is already initialized', async () => {
      messageProcessor._isInitialized = true;
      const result = await messageProcessor._loadConfigOrSkip(
        `${pathToFileURL('.')}/myFile.ts`,
      );
      expect(messageProcessor._initializeGraphQLCaches).not.toHaveBeenCalled();
      expect(result).toEqual(false);
    });
  });

  describe('handleDidOpenOrSaveNotification', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('');
      messageProcessor._initializeGraphQLCaches = jest.fn();
      messageProcessor._loadConfigOrSkip = jest.fn();
    });
    it('updates config for standard config filename changes', async () => {
      await messageProcessor.handleDidOpenOrSaveNotification({
        textDocument: {
          uri: `${pathToFileURL('.')}/.graphql.config.js`,
          languageId: 'js',
          version: 0,
          text: '',
        },
      });
      expect(messageProcessor._loadConfigOrSkip).toHaveBeenCalled();
    });

    it('updates config for custom config filename changes', async () => {
      const customConfigName = 'custom-config-name.yml';
      messageProcessor._settings = { load: { fileName: customConfigName } };

      await messageProcessor.handleDidOpenOrSaveNotification({
        textDocument: {
          uri: `${pathToFileURL('.')}/${customConfigName}`,
          languageId: 'js',
          version: 0,
          text: '',
        },
      });

      expect(messageProcessor._loadConfigOrSkip).toHaveBeenCalledWith(
        expect.stringContaining(customConfigName),
      );
    });

    it('handles config requests with no config', async () => {
      messageProcessor._settings = {};

      await messageProcessor.handleDidChangeConfiguration({
        settings: [],
      });

      expect(messageProcessor._initializeGraphQLCaches).toHaveBeenCalled();

      await messageProcessor.handleDidOpenOrSaveNotification({
        textDocument: {
          uri: `${pathToFileURL('.')}/.graphql.config.js`,
          languageId: 'js',
          version: 0,
          text: '',
        },
      });

      expect(messageProcessor._initializeGraphQLCaches).toHaveBeenCalled();
    });
  });

  describe('_handleConfigErrors', () => {
    it('handles missing config errors', async () => {
      messageProcessor._handleConfigError({
        err: new ConfigNotFoundError('test missing-config'),
        uri: 'test',
      });

      expect(messageProcessor._initializeGraphQLCaches).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('test missing-config'),
      );
    });
    it('handles missing project errors', async () => {
      messageProcessor._handleConfigError({
        err: new ProjectNotFoundError('test missing-project'),
        uri: 'test',
      });

      expect(messageProcessor._initializeGraphQLCaches).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Project not found for this file'),
      );
    });
    it('handles invalid config errors', async () => {
      messageProcessor._handleConfigError({
        err: new ConfigInvalidError('test invalid error'),
        uri: 'test',
      });

      expect(messageProcessor._initializeGraphQLCaches).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid configuration'),
      );
    });
    it('handles empty loader result errors', async () => {
      messageProcessor._handleConfigError({
        err: new LoaderNoResultError('test loader-error'),
        uri: 'test',
      });

      expect(messageProcessor._initializeGraphQLCaches).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('test loader-error'),
      );
    });
    it('handles generic errors', async () => {
      messageProcessor._handleConfigError({
        err: new Error('test loader-error'),
        uri: 'test',
      });

      expect(messageProcessor._initializeGraphQLCaches).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('test loader-error'),
      );
    });
  });
  describe('handleWatchedFilesChangedNotification', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue(' query { id }');
      messageProcessor._initializeGraphQLCaches = jest.fn();
      messageProcessor._updateFragmentDefinition = jest.fn();
      messageProcessor._isGraphQLConfigMissing = false;
      messageProcessor._isInitialized = true;
    });

    it('skips config updates for normal file changes', async () => {
      await messageProcessor.handleWatchedFilesChangedNotification({
        changes: [
          {
            uri: `${pathToFileURL(
              join(__dirname, '__queries__'),
            )}/test.graphql`,
            type: FileChangeType.Changed,
          },
        ],
      });

      expect(messageProcessor._initializeGraphQLCaches).not.toHaveBeenCalled();
      expect(messageProcessor._updateFragmentDefinition).toHaveBeenCalled();
    });
  });

  describe('handleWatchedFilesChangedNotification without graphql config', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('');
      messageProcessor._isGraphQLConfigMissing = true;
      messageProcessor._parser = jest.fn();
    });

    it('skips config updates for normal file changes', async () => {
      await messageProcessor.handleWatchedFilesChangedNotification({
        changes: [
          {
            uri: `${pathToFileURL('.')}/foo.js`,
            type: FileChangeType.Changed,
          },
        ],
      });
      expect(messageProcessor._parser).not.toHaveBeenCalled();
    });
  });

  describe('handleDidChangedNotification without graphql config', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('');
      messageProcessor._isGraphQLConfigMissing = true;
      messageProcessor._parser = jest.fn();
    });

    it('skips config updates for normal file changes', async () => {
      await messageProcessor.handleDidChangeNotification({
        textDocument: {
          uri: `${pathToFileURL('.')}/foo.js`,
          version: 1,
        },
        contentChanges: [{ text: 'var something' }],
      });
      expect(messageProcessor._parser).not.toHaveBeenCalled();
    });
  });
});

describe('processDiagnosticsMessage', () => {
  it('processes diagnostics messages', () => {
    const query = 'query { foo }';
    const inputRange = new Range(new Position(1, 1), new Position(1, 1));

    const diagnostics = processDiagnosticsMessage(
      [
        {
          severity: 1,
          message: 'test',
          source: 'GraphQL: Validation',
          range: inputRange,
        },
      ],
      query,
      inputRange,
    );

    expect(JSON.stringify(diagnostics)).toEqual(
      JSON.stringify([
        {
          severity: 1,
          message: 'test',
          source: 'GraphQL: Validation',
          range: new Range(new Position(2, 1), new Position(2, 1)),
        },
      ]),
    );
  });
  it('processes diagnostics messages with null range', () => {
    const query = 'query { foo }';
    const inputRange = new Range(new Position(1, 1), new Position(1, 1));

    const diagnostics = processDiagnosticsMessage(
      [
        {
          severity: 1,
          message: 'test',
          source: 'GraphQL: Validation',
          range: inputRange,
        },
      ],
      query,
      null,
    );

    expect(JSON.stringify(diagnostics)).toEqual(
      JSON.stringify([
        {
          severity: 1,
          message: 'test',
          source: 'GraphQL: Validation',
          range: inputRange,
        },
      ]),
    );
  });
});
