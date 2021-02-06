import { parse } from 'graphql';
import {
  isSubscriptionWithName,
  createWebsocketsFetcherFromUrl,
} from '../../dist/lib';

import 'isomorphic-fetch';

jest.mock('graphql-ws');

jest.mock('subscriptions-transport-ws');

import { createClient } from 'graphql-ws';

import { SubscriptionClient } from 'subscriptions-transport-ws';

const exampleWithSubscripton = /* GraphQL */ parse(`
  subscription Example {
    example
  }
  query SomethingElse {
    example
  }
`);

describe('isSubcriptionWithName', () => {
  it('detects when the subscription is present', () => {
    expect(
      isSubscriptionWithName(exampleWithSubscripton, 'Example'),
    ).toBeTruthy();
  });
  it('detects when the specified operation is not a subscription', () => {
    expect(
      isSubscriptionWithName(exampleWithSubscripton, 'SomethingElse'),
    ).toBeFalsy();
  });
  it('detects when the operation is not present', () => {
    expect(
      isSubscriptionWithName(exampleWithSubscripton, 'NotPresent'),
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
    expect(SubscriptionClient.mock.calls).toEqual([]);
  });

  it('creates a websockets client using provided url that fails to legacy client', async () => {
    createClient.mockReturnValue(false);
    await createWebsocketsFetcherFromUrl('wss://example.com');
    // @ts-ignore
    expect(createClient.mock.calls[0][0]).toEqual({ url: 'wss://example.com' });
    expect(SubscriptionClient.mock.calls[0][0]).toEqual('wss://example.com');
  });
});
