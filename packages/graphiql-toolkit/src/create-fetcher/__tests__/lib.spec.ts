import { parse } from 'graphql';
import {
  isSubscriptionWithName,
  createWebsocketsFetcherFromUrl,
  getWsFetcher,
} from '../lib';

import 'isomorphic-fetch';

jest.mock('graphql-ws');

jest.mock('subscriptions-transport-ws');

import { createClient } from 'graphql-ws';

import { SubscriptionClient } from 'subscriptions-transport-ws';

const exampleWithSubscription = /* GraphQL */ parse(`
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
    jest.resetAllMocks();
  });

  it('creates a websockets client using provided url', () => {
    createClient.mockReturnValue(true);
    createWebsocketsFetcherFromUrl('wss://example.com');
    // @ts-ignore
    expect(createClient.mock.calls[0][0]).toEqual({ url: 'wss://example.com' });
  });

  it('creates a websockets client using provided url that fails', async () => {
    createClient.mockReturnValue(false);
    expect(
      await createWebsocketsFetcherFromUrl('wss://example.com'),
    ).toThrowError();
    // @ts-ignore
    expect(createClient.mock.calls[0][0]).toEqual({ url: 'wss://example.com' });
  });
});

describe('getWsFetcher', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('provides an observable wsClient when custom wsClient option is provided', () => {
    createClient.mockReturnValue(true);
    getWsFetcher({
      url: '',
      // @ts-ignore
      wsClient: true,
    });
    // @ts-ignore
    expect(createClient.mock.calls).toHaveLength(0);
  });
  it('creates a subscriptions-transports-ws observable when custom legacyClient option is provided', () => {
    createClient.mockReturnValue(true);
    getWsFetcher({
      url: '',
      // @ts-ignore
      legacyClient: true,
    });
    // @ts-ignore
    expect(createClient.mock.calls).toHaveLength(0);
    expect(SubscriptionClient.mock.calls).toHaveLength(0);
  });

  it('if subscriptionsUrl is provided, create a client on the fly', () => {
    createClient.mockReturnValue(true);
    getWsFetcher({
      url: '',
      subscriptionUrl: 'wss://example',
    });
    expect(createClient.mock.calls[0]).toEqual([
      { connectionParams: undefined, url: 'wss://example' },
    ]);
    expect(SubscriptionClient.mock.calls).toHaveLength(0);
  });
});

describe('missing graphql-ws dependency', () => {
  it('should throw a nice error', () => {
    jest.resetModules();
    jest.doMock('graphql-ws', () => {
      throw { code: 'MODULE_NOT_FOUND' };
    });

    expect(() =>
      createWebsocketsFetcherFromUrl('wss://example.com'),
    ).toThrowError(
      /You need to install the 'graphql-ws' package to use websockets when passing a 'subscriptionUrl'/,
    );
  });
});
