/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import {expect} from 'chai';
import {Position} from 'graphql-language-service-utils';
import {beforeEach, describe, it} from 'mocha';

import * as handlers from '../MessageProcessor';
import MockWatchmanClient from '../__mocks__/MockWatchmanClient';

describe('MessageProcessor', () => {
  const queryDir = `${__dirname}/__queries__`;

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

  beforeEach(async () => {
    const params = {rootPath: __dirname};
    const watchmanClient = new MockWatchmanClient();
    const {capabilities} = await handlers.handleInitializeRequest(
      params,
      null,
      null,
      watchmanClient,
    );

    expect(capabilities.definitionProvider).to.equal(true);
    expect(capabilities.completionProvider.resolveProvider).to.equal(true);
    expect(capabilities.textDocumentSync).to.equal(1);

    const result = await handlers.handleDidOpenOrSaveNotification(
      initialDocument,
    );
    expect(result.uri).to.equal(initialDocument.textDocument.uri);

    // Invalid query, diagnostics will show an error
    expect(result.diagnostics.length).not.to.equal(0);
  });

  it('initializes properly and opens a file', () => {
    expect(true).to.equal(true);
  });

  it('runs completion requests', async () => {
    const empty = {
      textDocument: {text: '', uri: `${queryDir}/test2.graphql`, version: 0},
    };
    const out = await handlers.handleDidOpenOrSaveNotification(empty);
    expect(out.uri).to.equal(empty.textDocument.uri);

    const test = {
      position: new Position(0, 0),
      textDocument: empty.textDocument,
    };

    const expected = ['query', 'mutation', 'subscription', 'fragment', '{'];
    const result = await handlers.handleCompletionRequest(test);
    expect(result.items.length).to.equal(5);

    for (const index in result.items) {
      expect(expected).to.include(result.items[index].label);
    }
  });

  it('properly changes the file cache with the didChange handler', async () => {
    const textDocumentChangedString = `
      {
        hero(episode: NEWHOPE){
          name
        }
      }
      `;

    const params = {
      textDocument: {
        text: textDocumentTestString,
        uri: `${queryDir}test.graphql`,
        version: 1,
      },
      contentChanges: [
        {text: textDocumentTestString},
        {text: textDocumentChangedString},
      ],
    };
    const result = await handlers.handleDidChangeNotification(params);
    expect(result.uri).to.equal(params.textDocument.uri);

    // Query fixed, no more errors
    expect(result.diagnostics.length).to.equal(0);
  });

  it('properly removes from the file cache with the didClose handler', async () => {
    await handlers.handleDidCloseNotification(initialDocument);

    const position = {line: 4, character: 5};
    const params = {textDocument: initialDocument.textDocument, position};

    // Should throw because file has been deleted from cache
    return handlers
      .handleCompletionRequest(params)
      .then(result => expect(result).to.equal(null))
      .catch(error => {});
  });

  // Doesn't work with mock watchman client
  // TODO edit MessageProcessor to make the handlers easier to test
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

    await handlers.handleDidOpenOrSaveNotification(newDocument);

    const test = {
      position: new Position(3, 15),
      textDocument: newDocument.textDocument,
    };

    const result = await handlers.handleDefinitionRequest(test);
    expect(result[0].uri).to.equal(`file://${queryDir}/testFragment.graphql`);
  });
});
