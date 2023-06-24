import { DocumentNode, visit } from 'graphql';
import { meros } from 'meros';
import {
  Client,
  ClientOptions,
  ExecutionResult,
  createClient as createClientType,
} from 'graphql-ws';
import {
  isAsyncIterable,
  makeAsyncIterableIteratorFromSink,
} from '@n1ru4l/push-pull-async-iterable-iterator';

import type {
  Fetcher,
  FetcherParams,
  FetcherOpts,
  ExecutionResultPayload,
  CreateFetcherOptions,
} from './types';

const errorHasCode = (err: unknown): err is { code: string } => {
  return typeof err === 'object' && err !== null && 'code' in err;
};

/**
 * Returns true if the name matches a subscription in the AST
 *
 * @param document {DocumentNode}
 * @param name the operation name to lookup
 * @returns {boolean}
 */
export const isSubscriptionWithName = (
  document: DocumentNode,
  name: string | undefined,
): boolean => {
  let isSubscription = false;
  visit(document, {
    OperationDefinition(node) {
      if (name === node.name?.value && node.operation === 'subscription') {
        isSubscription = true;
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
export const createSimpleFetcher =
  (options: CreateFetcherOptions, httpFetch: typeof fetch): Fetcher =>
  async (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) => {
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
  let wsClient;
  try {
    const { createClient } = require('graphql-ws') as {
      createClient: typeof createClientType;
    };

    // TODO: defaults?
    wsClient = createClient({
      url,
      connectionParams,
    });
    return createWebsocketsFetcherFromClient(wsClient);
  } catch (err) {
    if (errorHasCode(err) && err.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        "You need to install the 'graphql-ws' package to use websockets when passing a 'subscriptionUrl'",
      );
    }
    // eslint-disable-next-line no-console
    console.error(`Error creating websocket client for ${url}`, err);
  }
};

/**
 * Create ws/s fetcher using provided wsClient implementation
 *
 * @param wsClient {Client}
 * @returns {Fetcher}
 */
export const createWebsocketsFetcherFromClient =
  (wsClient: Client) => (graphQLParams: FetcherParams) =>
    makeAsyncIterableIteratorFromSink<ExecutionResult>(sink =>
      wsClient.subscribe(graphQLParams, {
        ...sink,
        error(err) {
          if (err instanceof CloseEvent) {
            sink.error(
              new Error(
                `Socket closed with event ${err.code} ${
                  err.reason || ''
                }`.trim(),
              ),
            );
          } else {
            sink.error(err);
          }
        },
      }),
    );

/**
 * Allow legacy websockets protocol client, but no definitions for it,
 * as the library is deprecated and has security issues
 *
 * @param legacyWsClient
 * @returns
 */
export const createLegacyWebsocketsFetcher =
  (legacyWsClient: { request: (params: FetcherParams) => unknown }) =>
  (graphQLParams: FetcherParams) => {
    const observable = legacyWsClient.request(graphQLParams);
    return makeAsyncIterableIteratorFromSink<ExecutionResult>(
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
    }).then(r =>
      meros<Extract<ExecutionResultPayload, { hasNext: boolean }>>(r, {
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

/**
 * If `wsClient` or `legacyClient` are provided, then `subscriptionUrl` is overridden.
 * @param options {CreateFetcherOptions}
 * @returns
 */
export const getWsFetcher = (
  options: CreateFetcherOptions,
  fetcherOpts: FetcherOpts | undefined,
) => {
  if (options.wsClient) {
    return createWebsocketsFetcherFromClient(options.wsClient);
  }
  if (options.subscriptionUrl) {
    return createWebsocketsFetcherFromUrl(options.subscriptionUrl, {
      ...options.wsConnectionParams,
      ...fetcherOpts?.headers,
    });
  }
  const legacyWebsocketsClient = options.legacyClient || options.legacyWsClient;
  if (legacyWebsocketsClient) {
    return createLegacyWebsocketsFetcher(legacyWebsocketsClient);
  }
};
