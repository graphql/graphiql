import { DocumentNode, visit } from 'graphql';
import { meros } from 'meros';
import { createClient, Client, ClientOptions } from 'graphql-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import {
  isAsyncIterable,
  makeAsyncIterableIteratorFromSink,
} from '@n1ru4l/push-pull-async-iterable-iterator';

import type {
  Fetcher,
  FetcherResult,
  FetcherParams,
  FetcherOpts,
  FetcherResultPayload,
  CreateFetcherOptions,
} from './types';

/**
 * Returns true if the name matches a subscription in the AST
 *
 * @param document {DocumentNode}
 * @param name the operation name to lookup
 * @returns {boolean}
 */
export const isSubscriptionWithName = (
  document: DocumentNode,
  name: string,
): boolean => {
  let isSubscription = false;
  visit(document, {
    OperationDefinition(node) {
      if (name === node.name?.value) {
        if (node.operation === 'subscription') {
          isSubscription = true;
        }
      }
    },
  });
  return isSubscription;
};

/**
 * create a simple HTTP/S fetcher using a fetch implementation where
 * multipart is not needed
 *
 * @param options {CreateFetcherOptions}
 * @param httpFetch {typeof fetch}
 * @returns {Fetcher}
 */
export const createSimpleFetcher = (
  options: CreateFetcherOptions,
  httpFetch: typeof fetch,
): Fetcher => async (
  graphQLParams: FetcherParams,
  fetcherOpts?: FetcherOpts,
) => {
  const data = await httpFetch(options.url, {
    method: 'POST',
    body: JSON.stringify(graphQLParams),
    headers: {
      'content-type': 'application/json',
      ...options.headers,
      ...fetcherOpts?.headers,
    },
  });
  return data.json();
};

export const createWebsocketsFetcherFromUrl = (
  url: string,
  connectionParams?: ClientOptions['connectionParams'],
) => {
  let wsClient: Client | null = null;
  let legacyClient: SubscriptionClient | null = null;
  if (url) {
    try {
      try {
        // TODO: defaults?
        wsClient = createClient({
          url,
          connectionParams,
        });
        if (!wsClient) {
          legacyClient = new SubscriptionClient(url, { connectionParams });
        }
      } catch (err) {
        legacyClient = new SubscriptionClient(url, { connectionParams });
      }
    } catch (err) {
      console.error(`Error creating websocket client for:\n${url}\n\n${err}`);
    }
  }

  if (wsClient) {
    return createWebsocketsFetcherFromClient(wsClient);
  } else if (legacyClient) {
    return createLegacyWebsocketsFetcher(legacyClient);
  } else if (url) {
    throw Error('subscriptions client failed to initialize');
  }
};

/**
 * Create ws/s fetcher using provided wsClient implementation
 *
 * @param wsClient {Client}
 * @returns {Fetcher}
 */
export const createWebsocketsFetcherFromClient = (wsClient: Client) => (
  graphQLParams: FetcherParams,
) =>
  makeAsyncIterableIteratorFromSink<FetcherResult>(sink =>
    wsClient!.subscribe(graphQLParams, sink),
  );

export const createLegacyWebsocketsFetcher = (
  legacyWsClient: SubscriptionClient,
) => (graphQLParams: FetcherParams) => {
  const observable = legacyWsClient.request(graphQLParams);
  return makeAsyncIterableIteratorFromSink<FetcherResult>(
    // @ts-ignore
    sink => observable.subscribe(sink).unsubscribe,
  );
};
/**
 * create a fetcher with the `IncrementalDelivery` HTTP/S spec for
 * `@stream` and `@defer` support using `fetch-multipart-graphql`
 *
 * @param options {CreateFetcherOptions}
 * @returns {Fetcher}
 */
export const createMultipartFetcher = (
  options: CreateFetcherOptions,
  httpFetch: typeof fetch,
): Fetcher =>
  async function* (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) {
    const response = await httpFetch(options.url, {
      method: 'POST',
      body: JSON.stringify(graphQLParams),
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, multipart/mixed',
        ...options.headers,
        // allow user-defined headers to override
        // the static provided headers
        ...fetcherOpts?.headers,
      },
    }).then(response =>
      meros<Extract<FetcherResultPayload, { hasNext: boolean }>>(response, {
        multiple: true,
      }),
    );

    // Follows the same as createSimpleFetcher above, in that we simply return it as json.
    if (!isAsyncIterable(response)) {
      return yield response.json();
    }

    for await (const chunk of response) {
      if (chunk.some(part => !part.json)) {
        const message = chunk.map(
          part => `Headers::\n${part.headers}\n\nBody::\n${part.body}`,
        );
        throw new Error(
          `Expected multipart chunks to be of json type. got:\n${message}`,
        );
      }
      yield chunk.map(part => part.body);
    }
  };
