import { parse } from 'graphql';
import { isSubcriptionWithName, createWebsocketsClient } from '../lib';

import 'isomorphic-fetch';

jest.mock('graphql-ws');

jest.mock('graphql-transport-ws');

import { createClient } from 'graphql-ws';

import { createClient as createLegacyClient } from 'graphql-transport-ws';

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
      isSubcriptionWithName(exampleWithSubscripton, 'Example'),
    ).toBeTruthy();
  });
  it('detects when the specified operation is not a subscription', () => {
    expect(
      isSubcriptionWithName(exampleWithSubscripton, 'SomethingElse'),
    ).toBeFalsy();
  });
  it('detects when the operation is not present', () => {
    expect(
      isSubcriptionWithName(exampleWithSubscripton, 'NotPresent'),
    ).toBeFalsy();
  });
});

describe('createWebsocketsClient', () => {
  afterEach(() => {
    // @ts-ignore
    createClient.mockRestore();
  });
  it('creates a websockets client using provided url', () => {
    createWebsocketsClient({
      url: 'https://example.com',
      subscriptionsUrl: 'wss://example.com',
    });
    // @ts-ignore
    expect(createClient.mock.calls[0][0]).toEqual({ url: 'wss://example.com' });
  });
});
