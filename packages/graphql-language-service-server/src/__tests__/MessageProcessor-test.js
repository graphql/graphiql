/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import { expect } from 'chai';
import { Position, Range } from 'graphql-language-service-utils';
import { beforeEach, describe, it } from 'mocha';

import { MessageProcessor, getQueryAndRange } from '../MessageProcessor';
import MockWatchmanClient from '../__mocks__/MockWatchmanClient';
import { GraphQLConfig } from 'graphql-config';

describe('MessageProcessor', () => {
  const mockWatchmanClient = new MockWatchmanClient();
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
    };
  });
  messageProcessor._isInitialized = true;
  messageProcessor._logger = { log() {} };

  it('initializes properly and opens a file', async () => {
    const { capabilities } = await messageProcessor.handleInitializeRequest({
      rootPath: __dirname,
    });
    expect(capabilities.definitionProvider).to.equal(true);
    expect(capabilities.completionProvider.resolveProvider).to.equal(true);
    expect(capabilities.textDocumentSync).to.equal(1);
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
    expect(result).to.deep.equal({
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
    expect(result.diagnostics.length).to.equal(0);
  });

  it('properly removes from the file cache with the didClose handler', async () => {
    await messageProcessor.handleDidCloseNotification(initialDocument);

    const position = { line: 4, character: 5 };
    const params = { textDocument: initialDocument.textDocument, position };

    // Should throw because file has been deleted from cache
    return messageProcessor
      .handleCompletionRequest(params)
      .then(result => expect(result).to.equal(null))
      .catch(error => {});
  });

  // Doesn't work with mock watchman client
  // TODO edit MessageProcessor to make the messageProcessor easier to test
  it.skip('runs definition requests', async () => {
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
    expect(result[0].uri).to.equal(`file://${queryDir}/testFragment.graphql`);
  });

  it('loads configs without projects when watchman is present', async () => {
    const config = new GraphQLConfig(
      {
        schemaPath,
        includes: `${queryDir}/*.graphql`,
      },
      'not/a/real/config'
    );

    await messageProcessor._subcribeWatchman(config, mockWatchmanClient);
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
      'not/a/real/config'
    );

    await messageProcessor._subcribeWatchman(config, mockWatchmanClient);
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
    expect(contents[0].query).to.equal(`
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
    expect(contents.length).to.equal(0);
  });
});
