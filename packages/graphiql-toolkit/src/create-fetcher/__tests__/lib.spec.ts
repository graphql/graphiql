import { Mock } from 'vitest';
import { parse } from 'graphql';
import {
  isSubscriptionWithName,
  createWebsocketsFetcherFromUrl,
  getWsFetcher,
} from '../lib';

import 'isomorphic-fetch';

vi.mock('graphql-ws');

vi.mock('subscriptions-transport-ws');

import { createClient as _createClient } from 'graphql-ws';

import { SubscriptionClient as _SubscriptionClient } from 'subscriptions-transport-ws';

const createClient = _createClient as Mock<typeof _createClient>;
const SubscriptionClient = _SubscriptionClient as Mock;

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
});
