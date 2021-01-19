import { parse, getIntrospectionQuery } from 'graphql';
import { buildGraphiQLFetcher } from '../buildFetcher';

import 'isomorphic-fetch';

jest.mock('../lib');

jest.mock('graphql-ws');

jest.mock('graphql-transport-ws');

import {
  createWebsocketsClient,
  createWebsocketsFetcher,
  createMultipartFetcher,
  createSimpleFetcher,
} from '../lib';
import { createClient } from 'graphql-ws';

const exampleWithSubscripton =  /* GraphQL */ `
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

const exampleIntrospectionJson = parse(getIntrospectionQuery());

describe('buildGraphiQLFetcher', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('returns fetcher without websocket client by default', async () => {
    createWebsocketsClient.mockReturnValue(true);
    const fetcher = buildGraphiQLFetcher({ url: serverURL });
    expect(createWebsocketsClient.mock.calls).toEqual([]);
    expect(createMultipartFetcher.mock.calls).toEqual([
      [{ enableMultipart: true, url: serverURL }],
    ]);

  });
  it('returns fetcher without websocket client or multipart', () => {
    createWebsocketsClient.mockReturnValue(true);
    buildGraphiQLFetcher({ url: serverURL, enableMultipart: false });
    expect(createWebsocketsClient.mock.calls).toEqual([]);
    expect(createMultipartFetcher.mock.calls).toEqual([]);
    expect(createSimpleFetcher.mock.calls).toEqual([
      [{ enableMultipart: false, url: serverURL }, fetch],
    ]);
  });
  it('returns fetcher with websocket client', () => {
    createWebsocketsClient.mockReturnValue('Client1');

    const args = {
      url: serverURL,
      subscriptionsUrl: wssURL,
      enableMultipart: true,
    };

    buildGraphiQLFetcher(args);

    expect(createMultipartFetcher.mock.calls).toEqual([[args]]);
    expect(createWebsocketsClient.mock.calls).toEqual([[args]]);
    expect(createWebsocketsFetcher.mock.calls).toEqual([['Client1']]);
  });

  it('returns fetcher with custom wsClient', () => {
    createClient.mockReturnValue('WSClient');
    createWebsocketsFetcher.mockReturnValue('CustomWSSFetcher');

    const wsClient = createClient({ url: wssURL });
    const args = {
      url: serverURL,
      wsClient,
      enableMultipart: true,
    };

    buildGraphiQLFetcher(args);

    expect(createMultipartFetcher.mock.calls).toEqual([[args]]);
    expect(createWebsocketsClient.mock.calls).toEqual([]);
    expect(createWebsocketsFetcher.mock.calls).toEqual([['WSClient']]);
  });
});
