import { MessageProcessor } from '../MessageProcessor';

jest.mock('../Logger');

import { NoopLogger } from '../Logger';
import mockfs from 'mock-fs';
import { join } from 'node:path';

describe('MessageProcessor with no config', () => {
  let messageProcessor: MessageProcessor;
  const mockRoot = join('/tmp', 'test');
  let loggerSpy: jest.SpyInstance;
  let mockProcessor;

  beforeEach(() => {
    mockProcessor = (query: string, config?: string) => {
      const items = {
        'query.graphql': query,
      };
      if (config) {
        items['graphql.config.js'] = config;
      }
      const files: Parameters<typeof mockfs>[0] = {
        [mockRoot]: mockfs.directory({
          items,
        }),
        'node_modules/parse-json': mockfs.load('node_modules/parse-json'),
        'node_modules/error-ex': mockfs.load('node_modules/error-ex'),
        'node_modules/is-arrayish': mockfs.load('node_modules/is-arrayish'),
        'node_modules/json-parse-even-better-errors': mockfs.load(
          'node_modules/json-parse-even-better-errors',
        ),
        'node_modules/lines-and-columns': mockfs.load(
          'node_modules/lines-and-columns',
        ),
        'node_modules/@babel': mockfs.load('node_modules/@babel'),
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
  });

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
    //     },
    //   }),
    // });
    // // console.log(readdirSync(`${mockRoot}`));
    // await messageProcessor.handleDidOpenOrSaveNotification({
    //   textDocument: {
    //     text: 'module.exports = { schema: "schema.graphql" }',
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
