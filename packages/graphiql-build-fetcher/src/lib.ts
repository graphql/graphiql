import { DocumentNode, visit } from 'graphql';
import fetchMultipart from 'fetch-multipart-graphql';
import { createClient, Client } from 'graphql-ws';
import { createClient as createLegacyClient } from 'graphql-transport-ws';
import { makeAsyncIterableIteratorFromSink } from '@n1ru4l/push-pull-async-iterable-iterator';

import type { BuildFetcherOptions } from './';
import type {
  Fetcher,
  FetcherResult,
  FetcherParams,
  FetcherOpts,
} from '@graphiql/toolkit';

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
 * create a websockets client, following
 * `graphql-ws` Client signature
 *
 * @param options
 * @returns {Client | null}
 */
export const createWebsocketsClient = (
  options: BuildFetcherOptions,
): Client | null => {
  let wsClient: Client | null = null;
  try {
    try {
      // TODO: defaults?
      wsClient = createClient({
        url: options.subscriptionsUrl!,
      });
      if (!wsClient) {
        wsClient = createLegacyClient({
          url: options.subscriptionsUrl!,
        });
      }
    } catch (err) {
      wsClient = createLegacyClient({
        url: options.subscriptionsUrl!,
      });
    }
  } catch (err) {
    throw Error(
      `Error creating websocket client for:\n${options.subscriptionsUrl}`,
    );
  }
  return wsClient;
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

/**
 * Create ws/s fetcher using provided wsClient implementation
 *
 * @param wsClient {Client}
 * @returns {Fetcher}
 */
export const createWebsocketsFetcher = (wsClient: Client) => (
  graphQLParams: FetcherParams,
) =>
  makeAsyncIterableIteratorFromSink<FetcherResult>(sink =>
    wsClient!.subscribe(graphQLParams, sink),
  );

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
        // Introspection is broken if we return a array instead of a single item.
        // TODO: This should be addressed inside GraphiQL
        sink.next(parts[0]);
      },
      onError: sink.error,
      onComplete: sink.complete,
    });
    return () => undefined;
  });
