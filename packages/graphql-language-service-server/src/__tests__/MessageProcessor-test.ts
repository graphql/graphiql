/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */
import { tmpdir } from 'os';
import { SymbolKind } from 'vscode-languageserver';
import { FileChangeType } from 'vscode-languageserver-protocol';
import { Position, Range } from 'graphql-language-service';

import { MessageProcessor } from '../MessageProcessor';
import { parseDocument } from '../parseDocument';

jest.mock('../Logger');

import { GraphQLCache } from '../GraphQLCache';

import { loadConfig } from 'graphql-config';

import type { DefinitionQueryResult, Outline } from 'graphql-language-service';

import { Logger } from '../Logger';
import { pathToFileURL } from 'url';

jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  readFileSync: jest.fn(jest.requireActual('fs').readFileSync),
}));

describe('MessageProcessor', () => {
  const logger = new Logger(tmpdir());
  const messageProcessor = new MessageProcessor({
    // @ts-ignore
    connection: {},
    logger,
    fileExtensions: ['js'],
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
    });
    messageProcessor._languageService = {
      // @ts-ignore
      getAutocompleteSuggestions: (query, position, uri) => {
        return [{ label: `${query} at ${uri}` }];
      },
      // @ts-ignore
      getDiagnostics: (_query, _uri) => {
        return [];
      },
      getDocumentSymbols: async (_query: string, uri: string) => {
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
      getOutline: async (_query: string): Promise<Outline> => {
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
      getDefinition: async (
        _query,
        position,
        uri,
      ): Promise<DefinitionQueryResult> => {
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
        getConfiguration: async () => {
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
    return messageProcessor
      .handleCompletionRequest(params)
      .then(result => expect(result).toEqual(null))
      .catch(() => {});
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
    const mockReadFileSync: jest.Mock = jest.requireMock('fs').readFileSync;

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

  it('parseDocument finds queries in tagged templates', async () => {
    const text = `
// @flow
import {gql} from 'react-apollo';
import type {B} from 'B';
import A from './A';

const QUERY = gql\`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.js');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('parseDocument finds queries in tagged templates using typescript', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';

const QUERY: string = gql\`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.ts');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('parseDocument finds queries in tagged templates using tsx', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';

const QUERY: string = gql\`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {
  return <div>{QUERY}</div>
}`;

    const contents = parseDocument(text, 'test.tsx');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('parseDocument finds queries in multi-expression tagged templates using tsx', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';
const someValue = 'value'
const QUERY: string = gql\`
query Test {
  test {
    value
    $\{someValue}
    ...FragmentsComment
  }
  $\{someValue}
}\`

export function Example(arg: string) {
  return <div>{QUERY}</div>
}`;

    const contents = parseDocument(text, 'test.tsx');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    
    ...FragmentsComment
  }
  
}`);
  });
  // TODO: why an extra line here?
  it('parseDocument finds queries in multi-expression tagged template with declarations with using tsx', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';
const someValue = 'value'
type SomeType = { test: any }
const QUERY: string = gql<SomeType>\`
query Test {
  test {
    value
    $\{someValue}
    ...FragmentsComment
  }
  $\{someValue}
}\`

export function Example(arg: string) {
  return <div>{QUERY}</div>
}`;

    const contents = parseDocument(text, 'test.tsx');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    
    ...FragmentsComment
  }
  
}`);
  });

  it('parseDocument finds queries in multi-expression template strings using tsx', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';
const someValue = 'value'
const QUERY: string =
/* GraphQL */
\`
query Test {
  test {
    value
    \${someValue}
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {
  return <div>{QUERY}</div>
}`;

    const contents = parseDocument(text, 'test.tsx');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    
    ...FragmentsComment
  }
}
`);
  });

  it('parseDocument finds queries in #graphql-annotated templates', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';

const QUERY: string = \`#graphql
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.ts');
    expect(contents[0].query).toEqual(`#graphql
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('parseDocument finds queries in /*GraphQL*/-annotated templates', async () => {
    const text = `
import {gql} from 'react-apollo';
import {B} from 'B';
import A from './A';

const QUERY: string = /* GraphQL */ \`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.ts');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('parseDocument ignores non gql tagged templates', async () => {
    const text = `
// @flow
import randomthing from 'package';
import type {B} from 'B';
import A from './A';

const QUERY = randomthing\`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.fragments.test}
\`

export function Example(arg: string) {}`;

    const contents = parseDocument(text, 'test.js');
    expect(contents.length).toEqual(0);
  });

  it('an unparsable JS/TS file does not throw and bring down the server', async () => {
    const text = `
// @flow
import type randomthing fro 'package';
import type {B} from 'B';
im port A from './A';

con  QUERY = randomthing\`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
\${A.frag`;

    const contents = parseDocument(text, 'test.js');
    expect(contents.length).toEqual(0);
  });

  describe('handleWatchedFilesChangedNotification', () => {
    const mockReadFileSync: jest.Mock = jest.requireMock('fs').readFileSync;

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
});
