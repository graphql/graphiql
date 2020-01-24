/**
 *  Copyright (c) 2019 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Position, Range } from 'graphql-language-service-utils';

import { MessageProcessor, getQueryAndRange } from '../MessageProcessor';

jest.mock('../Logger');

import { DefinitionQueryResult } from 'graphql-language-service-types';

import { Logger } from '../Logger';

describe('MessageProcessor', () => {
  const logger = new Logger();
  const messageProcessor = new MessageProcessor(logger);

  const queryDir = `${__dirname}/__queries__`;
  const textDocumentTestString = `
  {
    hero(episode: NEWHOPE){
    }
  }
  `;

  beforeEach(() => {
    messageProcessor._graphQLCache = {
      // @ts-ignore
      getGraphQLConfig() {
        return {
          configDir: __dirname,
          getProjectNameForFile() {
            return null;
          },
        };
      },
      // @ts-ignore
      updateFragmentDefinition() {},
      // @ts-ignore
      updateObjectTypeDefinition() {},
      // @ts-ignore
      handleWatchmanSubscribeEvent() {},
    };
    messageProcessor._languageService = {
      // @ts-ignore
      getAutocompleteSuggestions: (query, position, uri) => {
        return [{ label: `${query} at ${uri}` }];
      },
      // @ts-ignore
      getDiagnostics: (query, uri) => {
        return [];
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

  const initialDocument = {
    textDocument: {
      text: textDocumentTestString,
      uri: `${queryDir}/test.graphql`,
      version: 0,
    },
  };

  messageProcessor._isInitialized = true;

  it('initializes properly and opens a file', async () => {
    const { capabilities } = await messageProcessor.handleInitializeRequest(
      // @ts-ignore
      {
        rootUri: __dirname,
      },
      null,
      __dirname,
    );
    expect(capabilities.definitionProvider).toEqual(true);
    expect(capabilities.completionProvider.resolveProvider).toEqual(true);
    expect(capabilities.textDocumentSync).toEqual(1);
  });

  it('runs completion requests properly', async () => {
    const uri = `${queryDir}/test2.graphql`;
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

  it('properly changes the file cache with the didChange handler', async () => {
    const uri = `file://${queryDir}/test.graphql`;
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
    await expect(result[0].uri).toEqual(`file://${queryDir}/test3.graphql`);
  });

  describe('getQueryRange', () => {
    describe('JavaScript', () => {
      function testExtension(ext: string) {
        describe('Extension: ".' + ext + '"', () => {
          it('finds queries in tagged templates', () => {
            const text = `
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

            const contents = getQueryAndRange(text, 'test.' + ext);
            expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    `);
          });

          it('ignores non gql tagged templates', () => {
            const text = `
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

            const contents = getQueryAndRange(text, 'test.' + ext);
            expect(contents.length).toEqual(0);
          });
        });
      }

      ['js', 'ts', 'jsx', 'tsx', 'es6', 'mjs', 'esm.js'].forEach(testExtension);
    });

    describe('ReasonML', () => {
      describe('ReasonRelay', () => {
        it('finds queries in tagged templates', () => {
          const text = `
    let something = "something";
    
    module Query = [%relay.query
      {|
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    |}
  ];`;

          const contents = getQueryAndRange(text, 'test.re');

          expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    `);
        });
      });

      describe('graphql_ppx', () => {
        it('finds queries in tagged templates', () => {
          const text = `
    let something = "something";
    
    module Query = [%graphql
      {|
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    |}
  ];`;

          const contents = getQueryAndRange(text, 'test.re');
          expect(contents[0].query).toEqual(`
    query Test {
      test {
        value
        ...FragmentsComment
      }
    }
    `);
        });
      });
    });

    describe('Raw GraphQL', () => {
      const gqlText = `query Test {
      test {
        value
        ...FragmentsComment
      }
    }`;

      test('.graphql', () => {
        const contents = getQueryAndRange(gqlText, 'test.graphql');

        expect(contents[0].query).toEqual(`query Test {
      test {
        value
        ...FragmentsComment
      }
    }`);
      });

      test('.gql', () => {
        const contents = getQueryAndRange(gqlText, 'test.gql');

        expect(contents[0].query).toEqual(`query Test {
      test {
        value
        ...FragmentsComment
      }
    }`);
      });
    });
  });
});
