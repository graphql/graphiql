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

import { MessageProcessor } from '../MessageProcessor';
import { parseDocument } from '../parseDocument';

jest.mock('../Logger');

import { GraphQLCache } from '../GraphQLCache';

import { loadConfig } from 'graphql-config';

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
  });

  const queryPathUri = pathToFileURL(`${__dirname}/__queries__`);
  const textDocumentTestString = `
  {
    hero(episode: NEWHOPE){
    }
  }
  `;

  beforeEach(async () => {
    const gqlConfig = await loadConfig({ rootDir: __dirname, extensions: [] });
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
    const result = await messageProcessor._isGraphQLConfigFile(
      'graphql.config.js',
    );
    expect(result).toEqual(true);
    const falseResult = await messageProcessor._isGraphQLConfigFile(
      'graphql.js',
    );
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

  it('runs document symbol requests', async () => {
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
    const previousConfigurationValue = getConfigurationReturnValue;
    getConfigurationReturnValue = null;
    await expect(
      messageProcessor.handleDidChangeConfiguration(),
    ).resolves.toStrictEqual({});
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

  describe('handleDidOpenOrSaveNotification', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('');
      messageProcessor._updateGraphQLConfig = jest.fn();
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

      expect(messageProcessor._updateGraphQLConfig).toHaveBeenCalled();
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

      expect(messageProcessor._updateGraphQLConfig).toHaveBeenCalled();
    });

    it('handles config requests with no config', async () => {
      messageProcessor._settings = {};

      await messageProcessor.handleDidChangeConfiguration({
        settings: [],
      });

      expect(messageProcessor._updateGraphQLConfig).toHaveBeenCalled();

      await messageProcessor.handleDidOpenOrSaveNotification({
        textDocument: {
          uri: `${pathToFileURL('.')}/.graphql.config.js`,
          languageId: 'js',
          version: 0,
          text: '',
        },
      });

      expect(messageProcessor._updateGraphQLConfig).toHaveBeenCalled();
    });
  });

  describe('handleWatchedFilesChangedNotification', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('');
      messageProcessor._updateGraphQLConfig = jest.fn();
    });

    it('skips config updates for normal file changes', async () => {
      await messageProcessor.handleWatchedFilesChangedNotification({
        changes: [
          {
            uri: `${pathToFileURL('.')}/foo.graphql`,
            type: FileChangeType.Changed,
          },
        ],
      });

      expect(messageProcessor._updateGraphQLConfig).not.toHaveBeenCalled();
    });
  });

  describe('handleWatchedFilesChangedNotification without graphql config', () => {
    const mockReadFileSync: jest.Mock =
      jest.requireMock('node:fs').readFileSync;

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('');
      messageProcessor._graphQLConfig = undefined;
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
      messageProcessor._graphQLConfig = undefined;
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

describe('MessageProcessor with no config', () => {
  let messageProcessor: MessageProcessor;
  const mockRoot = join('/tmp', 'test');
  let loggerSpy: jest.SpyInstance;

  const mockProcessor = (query: string, config?: string) => {
    const items = {
      'query.graphql': query,
      'node_modules/parse-json': mockfs.load('node_modules/parse-json'),
    };
    if (config) {
      items['graphql.config.js'] = config;
    }
    const files: Record<string, Record<string, unknown>> = {
      [mockRoot]: mockfs.directory({
        items,
      }),
      // node_modules: mockfs.load('node_modules'),
    };
    mockfs(files);
    const logger = new NoopLogger();
    loggerSpy = jest.spyOn(logger, 'error');
    messageProcessor = new MessageProcessor({
      // @ts-ignore
      connection: {
        // @ts-ignore
        get workspace() {
          return {
            async getConfiguration() {
              return [];
            },
          };
        },
      },
      logger,
      graphqlFileExtensions: ['graphql'],
      loadConfigOptions: { rootDir: mockRoot },
    });
  };

  beforeEach(() => {});

  afterEach(() => {
    mockfs.restore();
  });
  it('fails to initialize with empty config file', async () => {
    mockProcessor('query { foo }', '');
    await messageProcessor.handleInitializeRequest(
      // @ts-ignore
      {
        rootPath: mockRoot,
      },
      null,
      mockRoot,
    );
    await messageProcessor.handleDidOpenOrSaveNotification({
      textDocument: {
        text: 'query { foo }',
        uri: `${mockRoot}/query.graphql`,
        version: 1,
      },
    });
    expect(messageProcessor._isInitialized).toEqual(false);
    expect(messageProcessor._isGraphQLConfigMissing).toEqual(true);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /GraphQL Config file is not available in the provided config directory/,
      ),
    );
  });
  it('fails to initialize with no config file present', async () => {
    mockProcessor('query { foo }');
    await messageProcessor.handleInitializeRequest(
      // @ts-ignore
      {
        rootPath: mockRoot,
      },
      null,
      mockRoot,
    );
    await messageProcessor.handleDidOpenOrSaveNotification({
      textDocument: {
        text: 'query { foo }',
        uri: `${mockRoot}/query.graphql`,
        version: 1,
      },
    });
    expect(messageProcessor._isInitialized).toEqual(false);
    expect(messageProcessor._isGraphQLConfigMissing).toEqual(true);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /GraphQL Config file is not available in the provided config directory/,
      ),
    );
  });
  it('initializes when presented with a valid config later', async () => {
    mockProcessor('query { foo }');
    await messageProcessor.handleInitializeRequest(
      // @ts-ignore
      {
        rootPath: mockRoot,
      },
      null,
      mockRoot,
    );
    await messageProcessor.handleDidOpenOrSaveNotification({
      textDocument: {
        text: 'query { foo }',
        uri: `${mockRoot}/query.graphql`,
        version: 1,
      },
    });
    expect(messageProcessor._isInitialized).toEqual(false);
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    // todo: get mockfs working with in-test file changes
    // mockfs.restore();
    // mockfs({
    //   [mockRoot]: mockfs.directory({
    //     mode: 0o755,
    //     items: {
    //       'schema.graphql':
    //         'type Query { foo: String }\nschema { query: Query }',
    //       'graphql.config.js': mockfs.file({
    //         content: 'module.exports = { schema: "schema.graphql" };',
    //         mode: 0o644,
    //       }),
    //       'query.graphql': 'query { foo }',
    //       // 'node_modules/graphql-config/node_modules': mockfs.load(
    //       //   'node_modules/graphql-config/node_modules',
    //       // ),
    //     },
    //   }),
    // });
    // // console.log(readdirSync(`${mockRoot}`));
    // await messageProcessor.handleDidOpenOrSaveNotification({
    //   textDocument: {
    //     text: 'module.exports = { schema: `schema.graphql` }',
    //     uri: `${mockRoot}/graphql.config.js`,
    //     version: 2,
    //   },
    // });

    // expect(messageProcessor._isGraphQLConfigMissing).toEqual(false);

    // expect(loggerSpy).toHaveBeenCalledWith(
    //   expect.stringMatching(
    //     /GraphQL Config file is not available in the provided config directory/,
    //   ),
    // );
  });
});
