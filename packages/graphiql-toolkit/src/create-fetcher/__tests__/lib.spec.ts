import { type Mock, describe, it, expect, vi, afterEach } from 'vitest';
import { parse } from 'graphql';
import {
  isSubscriptionWithName,
  createSubscriptionFetcherFromClient,
  createSseFetcherFromClient,
  createSseFetcherFromUrl,
  createWebsocketsFetcherFromUrl,
  getSubscriptionFetcher,
  getWsFetcher,
} from '../lib';

import 'isomorphic-fetch';

vi.mock('graphql-ws');
vi.mock('graphql-sse');

vi.mock('subscriptions-transport-ws');

import { createClient as _createClient } from 'graphql-ws';
import { createClient as _createSseClient } from 'graphql-sse';

import { SubscriptionClient as _SubscriptionClient } from 'subscriptions-transport-ws';

const createClient = _createClient as Mock<typeof _createClient>;
const createSseClient = _createSseClient as Mock<typeof _createSseClient>;
const SubscriptionClient = _SubscriptionClient as Mock;
const sseURL = 'https://example.com/graphql/stream';

const exampleWithSubscription = parse(/* GraphQL */ `
  subscription Example {
    example
  }
  query SomethingElse {
    example
  }
`);

describe('isSubscriptionWithName', () => {
  it('detects when the subscription is present', () => {
    expect(
      isSubscriptionWithName(exampleWithSubscription, 'Example'),
    ).toBeTruthy();
  });
  it('detects when the specified operation is not a subscription', () => {
    expect(
      isSubscriptionWithName(exampleWithSubscription, 'SomethingElse'),
    ).toBeFalsy();
  });
  it('detects when the operation is not present', () => {
    expect(
      isSubscriptionWithName(exampleWithSubscription, 'NotPresent'),
    ).toBeFalsy();
  });
});

describe('createWebsocketsFetcherFromUrl', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('creates a websockets client using provided url', async () => {
    // @ts-expect-error
    createClient.mockReturnValue(true);
    await createWebsocketsFetcherFromUrl('wss://example.com');
    expect(createClient.mock.calls[0][0]).toEqual({ url: 'wss://example.com' });
  });

  it('creates a websockets client using provided url that fails', async () => {
    // @ts-expect-error
    createClient.mockReturnValue(false);
    expect(await createWebsocketsFetcherFromUrl('wss://example.com')).toThrow();
    expect(createClient.mock.calls[0][0]).toEqual({ url: 'wss://example.com' });
  });
});

describe('createSubscriptionFetcherFromClient', () => {
  it('adapts subscription clients to async iterables and disposes them', async () => {
    const unsubscribe = vi.fn();
    const client = {
      subscribe: vi.fn((_payload, sink) => {
        sink.next({ data: { example: true } });
        return unsubscribe;
      }),
    };
    const fetcher = createSubscriptionFetcherFromClient(client);

    const result = fetcher({
      query: 'subscription Example { example }',
      operationName: 'Example',
    }) as AsyncIterableIterator<unknown>;

    await expect(result.next()).resolves.toEqual({
      done: false,
      value: { data: { example: true } },
    });

    await result.return?.();

    expect(client.subscribe.mock.calls[0][0]).toEqual({
      query: 'subscription Example { example }',
      operationName: 'Example',
    });
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('runs additional owner cleanup after disposing the subscription', async () => {
    const unsubscribe = vi.fn();
    const disposeClient = vi.fn();
    const client = {
      subscribe: vi.fn(() => unsubscribe),
    };
    const fetcher = createSubscriptionFetcherFromClient(
      client,
      undefined,
      disposeClient,
    );

    const result = fetcher({
      query: 'subscription Example { example }',
      operationName: 'Example',
    }) as AsyncIterableIterator<unknown>;

    await result.return?.();

    expect(unsubscribe).toHaveBeenCalled();
    expect(disposeClient).toHaveBeenCalled();
  });
});

describe('createSseFetcherFromUrl', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('creates an SSE client using provided url, headers and client options', async () => {
    // @ts-expect-error
    createSseClient.mockReturnValue(true);
    await createSseFetcherFromUrl(
      sseURL,
      { authorization: 'Bearer token' },
      { singleConnection: true },
    );
    expect(createSseClient.mock.calls[0][0]).toEqual({
      singleConnection: true,
      url: sseURL,
      headers: { authorization: 'Bearer token' },
    });
  });

  it('disposes internally created SSE clients when the subscription closes', async () => {
    const unsubscribe = vi.fn();
    const disposeClient = vi.fn();
    createSseClient.mockReturnValue({
      subscribe: vi.fn(() => unsubscribe),
      iterate: vi.fn(),
      dispose: disposeClient,
    });
    const fetcher = await createSseFetcherFromUrl(sseURL);

    const result = fetcher?.({
      query: 'subscription Example { example }',
      operationName: 'Example',
    }) as AsyncIterableIterator<unknown>;

    await result.return?.();

    expect(unsubscribe).toHaveBeenCalled();
    expect(disposeClient).toHaveBeenCalled();
  });
});

describe('createSseFetcherFromClient', () => {
  it('does not dispose caller-owned SSE clients', async () => {
    const unsubscribe = vi.fn();
    const disposeClient = vi.fn();
    const fetcher = createSseFetcherFromClient({
      subscribe: vi.fn(() => unsubscribe),
      dispose: disposeClient,
    });

    const result = fetcher({
      query: 'subscription Example { example }',
      operationName: 'Example',
    }) as AsyncIterableIterator<unknown>;

    await result.return?.();

    expect(unsubscribe).toHaveBeenCalled();
    expect(disposeClient).not.toHaveBeenCalled();
  });
});

describe('getWsFetcher', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });
  it('provides an observable wsClient when custom wsClient option is provided', async () => {
    // @ts-expect-error
    createClient.mockReturnValue(true);
    // @ts-expect-error
    await getWsFetcher({ url: '', wsClient: true });
    expect(createClient.mock.calls).toHaveLength(0);
  });
  it('creates a subscriptions-transports-ws observable when custom legacyClient option is provided', async () => {
    // @ts-expect-error
    createClient.mockReturnValue(true);
    await getWsFetcher({ url: '', legacyClient: true });
    expect(createClient.mock.calls).toHaveLength(0);
    expect(SubscriptionClient.mock.calls).toHaveLength(0);
  });

  it('if subscriptionsUrl is provided, create a client on the fly', async () => {
    // @ts-expect-error
    createClient.mockReturnValue(true);
    await getWsFetcher({ url: '', subscriptionUrl: 'wss://example' });
    expect(createClient.mock.calls[0]).toEqual([
      { connectionParams: {}, url: 'wss://example' },
    ]);
    expect(SubscriptionClient.mock.calls).toHaveLength(0);
  });
});

describe('getSubscriptionFetcher', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('prefers a custom sseClient option over websocket options', async () => {
    // @ts-expect-error
    createClient.mockReturnValue(true);
    await getSubscriptionFetcher({
      url: '',
      // @ts-expect-error
      sseClient: true,
      // @ts-expect-error
      wsClient: true,
      subscriptionUrl: 'wss://example',
    });
    expect(createSseClient.mock.calls).toHaveLength(0);
    expect(createClient.mock.calls).toHaveLength(0);
  });

  it('creates an SSE client when sseUrl is provided and merges headers', async () => {
    // @ts-expect-error
    createSseClient.mockReturnValue(true);
    await getSubscriptionFetcher(
      {
        url: '',
        sseUrl: sseURL,
        subscriptionUrl: 'wss://example',
        headers: { 'x-static': 'static' },
        sseClientOptions: { singleConnection: true },
      },
      { headers: { 'x-request': 'request' } },
    );
    expect(createSseClient.mock.calls[0][0]).toEqual({
      singleConnection: true,
      url: sseURL,
      headers: { 'x-static': 'static', 'x-request': 'request' },
    });
    expect(createClient.mock.calls).toHaveLength(0);
  });

  it('falls back to websocket options when SSE is not configured', async () => {
    // @ts-expect-error
    createClient.mockReturnValue(true);
    await getSubscriptionFetcher({
      url: '',
      subscriptionUrl: 'wss://example',
    });
    expect(createClient.mock.calls[0]).toEqual([
      { connectionParams: {}, url: 'wss://example' },
    ]);
  });
});

describe('missing `graphql-ws` dependency', () => {
  it('should throw a nice error', async () => {
    vi.resetModules();
    vi.doMock('graphql-ws', () => {
      // While throwing an error directly inside this callback `code` is attached in `cause`
      // property e.g. `Error.cause.code`, so I throw an error on calling `createClient` instead

      return {
        createClient: vi.fn().mockImplementation(() => {
          // eslint-disable-next-line no-throw-literal
          throw { code: 'MODULE_NOT_FOUND' };
        }),
      };
    });

    await expect(
      createWebsocketsFetcherFromUrl('wss://example.com'),
    ).rejects.toThrow(
      /You need to install the 'graphql-ws' package to use websockets when passing a 'subscriptionUrl'/,
    );
  });

  it('should throw a nice error when ESM import reports a missing module', async () => {
    vi.resetModules();
    vi.doMock('graphql-ws', () => {
      return {
        createClient: vi.fn().mockImplementation(() => {
          // eslint-disable-next-line no-throw-literal
          throw { code: 'ERR_MODULE_NOT_FOUND' };
        }),
      };
    });

    await expect(
      createWebsocketsFetcherFromUrl('wss://example.com'),
    ).rejects.toThrow(
      /You need to install the 'graphql-ws' package to use websockets when passing a 'subscriptionUrl'/,
    );
  });
});

describe('missing `graphql-sse` dependency', () => {
  it('should throw a nice error', async () => {
    vi.resetModules();
    vi.doMock('graphql-sse', () => {
      return {
        createClient: vi.fn().mockImplementation(() => {
          // eslint-disable-next-line no-throw-literal
          throw { code: 'MODULE_NOT_FOUND' };
        }),
      };
    });

    await expect(createSseFetcherFromUrl(sseURL)).rejects.toThrow(
      /You need to install the 'graphql-sse' package to use GraphQL over SSE when passing an 'sseUrl'/,
    );
  });
});
