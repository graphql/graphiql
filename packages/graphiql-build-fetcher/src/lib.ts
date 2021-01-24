import { DocumentNode, visit } from 'graphql';
import fetchMultipart from 'fetch-multipart-graphql';
import { createClient, Client } from 'graphql-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { makeAsyncIterableIteratorFromSink } from '@n1ru4l/push-pull-async-iterable-iterator';

import type {
  Fetcher,
  FetcherResult,
  FetcherParams,
  FetcherOpts,
} from '@graphiql/toolkit';
import type { BuildFetcherOptions } from './types';

/**
 * Returns true if the name matches a subscription in the AST
 *
 * @param document {DocumentNode}
 * @param name the operation name to lookup
 * @returns {boolean}
 */
export const isSubcriptionWithName = (
  document: DocumentNode,
  name: string,
): boolean => {
  let isSubcription = false;
  visit(document, {
    OperationDefinition(node) {
      if (name === node.name?.value) {
        if (node.operation === 'subscription') {
          isSubcription = true;
        }
      }
    },
  });
  return isSubcription;
};

/**
 * create a simple HTTP/S fetcher using a fetch implementation where
 * multipart is not needed
 *
 * @param options {BuildFetcherOptions}
 * @param httpFetch {typeof fetch}
 * @returns {Fetcher}
 */
export const createSimpleFetcher = (
  options: BuildFetcherOptions,
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

export const createWebsocketsFetcherFromUrl = (url: string) => {
  let wsClient: Client | null = null;
  let legacyClient: SubscriptionClient | null = null;
  if (url) {
    try {
      try {
        // TODO: defaults?
        wsClient = createClient({
          url,
        });
        if (!wsClient) {
          legacyClient = new SubscriptionClient(url);
        }
      } catch (err) {
        legacyClient = new SubscriptionClient(url);
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
 * @param options {BuildFetcherOptions}
 * @returns {Fetcher}
 */
export const createMultipartFetcher = (
  options: BuildFetcherOptions,
): Fetcher => async (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) =>
  makeAsyncIterableIteratorFromSink<FetcherResult>(sink => {
    fetchMultipart<FetcherResult>(options.url, {
      method: 'POST',
      body: JSON.stringify(graphQLParams),
      headers: {
        'content-type': 'application/json',
        ...options.headers,
        // allow user-defined headers to override
        // the static provided headers
        ...fetcherOpts?.headers,
      },
      onNext: parts => {
        // @ts-ignore
        sink.next(parts);
      },
      onError: sink.error,
      onComplete: sink.complete,
    });
    return () => undefined;
  });
