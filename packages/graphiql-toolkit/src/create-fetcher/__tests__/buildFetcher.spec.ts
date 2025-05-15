import { Mock } from 'vitest';
import { parse, getIntrospectionQuery } from 'graphql';
import { createGraphiQLFetcher } from '../createFetcher';

import 'isomorphic-fetch';

vi.mock('../lib');

vi.mock('graphql-ws');

vi.mock('subscriptions-transport-ws');

import {
  createWebsocketsFetcherFromUrl as _createWebsocketsFetcherFromUrl,
  createMultipartFetcher as _createMultipartFetcher,
  createSimpleFetcher as _createSimpleFetcher,
  createWebsocketsFetcherFromClient as _createWebsocketsFetcherFromClient,
  createLegacyWebsocketsFetcher as _createLegacyWebsocketsFetcher,
} from '../lib';
import { createClient as _createClient } from 'graphql-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';

const serverURL = 'http://localhost:3000/graphql';
const wssURL = 'ws://localhost:3000/graphql';

const exampleIntrospectionDocument = parse(getIntrospectionQuery());

const createWebsocketsFetcherFromUrl = _createWebsocketsFetcherFromUrl as Mock<
  typeof _createWebsocketsFetcherFromUrl
>;
const createMultipartFetcher = _createMultipartFetcher as Mock<
  typeof _createMultipartFetcher
>;
const createSimpleFetcher = _createSimpleFetcher as Mock<
  typeof _createSimpleFetcher
>;
const createClient = _createClient as Mock<typeof _createClient>;
const createWebsocketsFetcherFromClient =
  _createWebsocketsFetcherFromClient as Mock<
    typeof _createWebsocketsFetcherFromClient
  >;
const createLegacyWebsocketsFetcher = _createLegacyWebsocketsFetcher as Mock<
  typeof _createLegacyWebsocketsFetcher
>;

describe('createGraphiQLFetcher', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });
  it('returns fetcher without websocket client by default', () => {
    // @ts-expect-error
    createWebsocketsFetcherFromUrl.mockReturnValue(true);
    createGraphiQLFetcher({ url: serverURL });
    expect(createWebsocketsFetcherFromUrl.mock.calls).toEqual([]);
    expect(createMultipartFetcher.mock.calls).toEqual([
      [{ enableIncrementalDelivery: true, url: serverURL }, fetch],
    ]);
  });

  it('returns simple fetcher for introspection', async () => {
    // @ts-expect-error
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
      { documentAST: exampleIntrospectionDocument },
    );
    expect(res).toEqual('hey!');
  });
  it('returns fetcher without websocket client or multipart', () => {
    // @ts-expect-error
    createWebsocketsFetcherFromUrl.mockReturnValue(true);
    createGraphiQLFetcher({ url: serverURL, enableIncrementalDelivery: false });
    expect(createWebsocketsFetcherFromUrl.mock.calls).toEqual([]);
    expect(createMultipartFetcher.mock.calls).toEqual([]);
    expect(createSimpleFetcher.mock.calls).toEqual([
      [{ enableIncrementalDelivery: false, url: serverURL }, fetch],
    ]);
  });
  it('returns fetcher with websocket client', () => {
    // @ts-expect-error
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
    // @ts-expect-error
    createClient.mockReturnValue('WSClient');
    // @ts-expect-error
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
    // @ts-expect-error
    createClient.mockReturnValue('WSClient');
    // @ts-expect-error
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
