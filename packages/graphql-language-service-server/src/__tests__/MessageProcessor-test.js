/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import { Position, Range } from 'graphql-language-service-utils';

import { MessageProcessor, getQueryAndRange } from '../MessageProcessor';

jest.mock('../GraphQLWatchman');
import { GraphQLWatchman } from '../GraphQLWatchman';
import { GraphQLConfig } from 'graphql-config';

describe('MessageProcessor', () => {
  const mockWatchmanClient = new GraphQLWatchman();
  const messageProcessor = new MessageProcessor(undefined, mockWatchmanClient);

  const queryDir = `${__dirname}/__queries__`;
  const schemaPath = `${__dirname}/__schema__/StarWarsSchema.graphql`;
  const textDocumentTestString = `
  {
    hero(episode: NEWHOPE){
    }
  }
  `;

  const initialDocument = {
    textDocument: {
      text: textDocumentTestString,
      uri: `${queryDir}/test.graphql`,
      version: 0,
    },
  };

  beforeEach(() => {
    messageProcessor._graphQLCache = {
      getGraphQLConfig() {
        return {
          configDir: __dirname,
          getProjectNameForFile() {
            return null;
          },
        };
      },
      updateFragmentDefinition() {},
      updateObjectTypeDefinition() {},
      handleWatchmanSubscribeEvent() {},
    };
    messageProcessor._languageService = {
      getAutocompleteSuggestions: (query, position, uri) => {
        return [{ label: `${query} at ${uri}` }];
      },
      getDiagnostics: (query, uri) => {
        return [];
      },
      getDefinition: (query, position, uri) => {
        return {
          definitions: [
            {
              uri,
              position,
              path: uri,
            },
          ],
        };
      },
    };
  });
  messageProcessor._isInitialized = true;
  messageProcessor._logger = { log() {} };

  it('initializes properly and opens a file', async () => {
    const { capabilities } = await messageProcessor.handleInitializeRequest({
      rootPath: __dirname,
    });
    expect(capabilities.definitionProvider).toEqual(true);
    expect(capabilities.completionProvider.resolveProvider).toEqual(true);
    expect(capabilities.textDocumentSync).toEqual(1);
  });

  it('runs completion requests properly', async () => {
    const uri = `${queryDir}/test2.graphql`;
    const query = 'test';
    messageProcessor._textDocumentCache.set(uri, {
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

  it('properly changes the file cache with the didChange handler', async () => {
    const uri = `file://${queryDir}/test.graphql`;
    messageProcessor._textDocumentCache.set(uri, {
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

  it('properly removes from the file cache with the didClose handler', async () => {
    await messageProcessor.handleDidCloseNotification(initialDocument);

    const position = { line: 4, character: 5 };
    const params = { textDocument: initialDocument.textDocument, position };

    // Should throw because file has been deleted from cache
    return messageProcessor
      .handleCompletionRequest(params)
      .then(result => expect(result).toEqual(null))
      .catch(error => {});
  });

  // Doesn't work with mock watchman client
  it('runs definition requests', async () => {
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
        uri: `${queryDir}/test3.graphql`,
        version: 0,
      },
    };

    await messageProcessor.handleDidOpenOrSaveNotification(newDocument);

    const test = {
      position: new Position(3, 15),
      textDocument: newDocument.textDocument,
    };

    const result = await messageProcessor.handleDefinitionRequest(test);
    await expect(result[0].uri).toEqual(`file://${queryDir}/test3.graphql`);
  });

  it('loads configs without projects when watchman is present', async () => {
    const config = new GraphQLConfig(
      {
        schemaPath,
        includes: `${queryDir}/*.graphql`,
      },
      'not/a/real/config',
    );

    await messageProcessor._subcribeWatchman(config, mockWatchmanClient);
    await expect(mockWatchmanClient.subscribe).toBeCalledTimes(1);
    await expect(mockWatchmanClient.subscribe).toBeCalledWith(
      'not/a/real',
      undefined,
    );
  });

  it('loads configs with projects when watchman is present', async () => {
    const config = new GraphQLConfig(
      {
        projects: {
          foo: {
            schemaPath,
            includes: `${queryDir}/*.graphql`,
          },
        },
      },
      'not/a/real/config',
    );

    await messageProcessor._subcribeWatchman(config, mockWatchmanClient);
    await expect(mockWatchmanClient.subscribe).toBeCalledTimes(1);
    await expect(mockWatchmanClient.subscribe).toBeCalledWith(
      'not/a/real',
      undefined,
    );
  });

  it('getQueryAndRange finds queries in tagged templates', async () => {
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

    const contents = getQueryAndRange(text, 'test.js');
    expect(contents[0].query).toEqual(`
query Test {
  test {
    value
    ...FragmentsComment
  }
}
`);
  });

  it('getQueryAndRange ignores non gql tagged templates', async () => {
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

    const contents = getQueryAndRange(text, 'test.js');
    expect(contents.length).toEqual(0);
  });
});
