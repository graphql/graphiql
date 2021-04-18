import { parse, getIntrospectionQuery } from 'graphql';
import { createGraphiQLFetcher } from '../createFetcher';

import 'isomorphic-fetch';

jest.mock('../lib');

jest.mock('graphql-ws');

jest.mock('subscriptions-transport-ws');

import {
  createWebsocketsFetcherFromUrl,
  createMultipartFetcher,
  createSimpleFetcher,
  createWebsocketsFetcherFromClient,
  createLegacyWebsocketsFetcher,
} from '../lib';
import { createClient } from 'graphql-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';

const exampleWithSubscripton = /* GraphQL */ `
  subscription Example {
    example
  }
  query SomethingElse {
    example
  }
`;

const exampleWithSubscriptonNode = parse(exampleWithSubscripton);

const serverURL = 'http://localhost:3000/graphql';
const wssURL = 'ws://localhost:3000/graphql';

const exampleIntrospectionDocument = parse(getIntrospectionQuery());

describe('createGraphiQLFetcher', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('returns fetcher without websocket client by default', async () => {
    createWebsocketsFetcherFromUrl.mockReturnValue(true);
    const fetcher = createGraphiQLFetcher({ url: serverURL });
    expect(createWebsocketsFetcherFromUrl.mock.calls).toEqual([]);
    expect(createMultipartFetcher.mock.calls).toEqual([
      [{ enableIncrementalDelivery: true, url: serverURL }, fetch],
    ]);
  });

  it('returns simple fetcher for introspection', async () => {
    createSimpleFetcher.mockReturnValue(async () => 'hey!');
    const fetcher = createGraphiQLFetcher({ url: serverURL });
    expect(createWebsocketsFetcherFromUrl.mock.calls).toEqual([]);
    expect(createMultipartFetcher.mock.calls).toEqual([
      [{ enableIncrementalDelivery: true, url: serverURL }, fetch],
    ]);
    expect(createSimpleFetcher.mock.calls).toEqual([
      [{ enableIncrementalDelivery: true, url: serverURL }, fetch],
    ]);
    const res = await fetcher(
      { query: getIntrospectionQuery(), operationName: 'IntrospectionQuery' },
      {
        documentAST: exampleIntrospectionDocument,
        shouldPersistHeaders: false,
      },
    );
    expect(res).toEqual('hey!');
  });
  it('returns fetcher without websocket client or multipart', () => {
    createWebsocketsFetcherFromUrl.mockReturnValue(true);
    createGraphiQLFetcher({ url: serverURL, enableIncrementalDelivery: false });
    expect(createWebsocketsFetcherFromUrl.mock.calls).toEqual([]);
    expect(createMultipartFetcher.mock.calls).toEqual([]);
    expect(createSimpleFetcher.mock.calls).toEqual([
      [{ enableIncrementalDelivery: false, url: serverURL }, fetch],
    ]);
  });
  it('returns fetcher with websocket client', () => {
    createWebsocketsFetcherFromUrl.mockReturnValue('Client1');

    const args = {
      url: serverURL,
      subscriptionUrl: wssURL,
      enableIncrementalDelivery: true,
    };

    createGraphiQLFetcher(args);

    expect(createMultipartFetcher.mock.calls).toEqual([[args, fetch]]);
  });

  it('returns fetcher with custom wsClient', () => {
    createClient.mockReturnValue('WSClient');
    createWebsocketsFetcherFromUrl.mockReturnValue('CustomWSSFetcher');

    const wsClient = createClient({ url: wssURL });
    const args = {
      url: serverURL,
      wsClient,
      enableIncrementalDelivery: true,
    };

    createGraphiQLFetcher(args);

    expect(createMultipartFetcher.mock.calls).toEqual([[args, fetch]]);
    expect(createWebsocketsFetcherFromUrl.mock.calls).toEqual([]);
  });

  it('returns fetcher with custom legacyClient', () => {
    createClient.mockReturnValue('WSClient');
    createLegacyWebsocketsFetcher.mockReturnValue('CustomWSSFetcher');

    const legacyClient = new SubscriptionClient(wssURL);
    const args = {
      url: serverURL,
      legacyClient,
      enableIncrementalDelivery: true,
    };

    createGraphiQLFetcher(args);

    expect(createMultipartFetcher.mock.calls).toEqual([[args, fetch]]);
    expect(createWebsocketsFetcherFromUrl.mock.calls).toEqual([]);
    expect(createWebsocketsFetcherFromClient.mock.calls).toEqual([]);
    expect(createLegacyWebsocketsFetcher.mock.calls).toEqual([]);
  });
});
