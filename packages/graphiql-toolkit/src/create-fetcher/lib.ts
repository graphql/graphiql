import { DocumentNode, visit } from 'graphql';
import { meros } from 'meros';
import type {
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
 * Merge two Headers instances into one.
 *
 * Returns a new Headers instance (does not mutate).
 *
 * Headers are merged by having a copy of the first headers argument apply its `set`
 * method to assign each header from the second headers argument. This means that headers
 * from the second Headers instance overwrite same-named headers in the first.
 */
const mergeHeadersWithSetStrategy = (headersA: Headers, headersB: Headers) => {
  const newHeaders = new Headers(headersA);
  for (const [key, value] of headersB.entries()) {
    newHeaders.set(key, value);
  }
  return newHeaders;
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
  name?: string,
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
    const headers = [
      new Headers({
        'content-type': 'application/json',
      }),
      new Headers(options.headers ?? {}),
      new Headers(fetcherOpts?.headers ?? {}),
    ].reduce(mergeHeadersWithSetStrategy, new Headers());

    const data = await httpFetch(options.url, {
      method: 'POST',
      body: JSON.stringify(graphQLParams),
      headers,
    });
    return data.json();
  };

export async function createWebsocketsFetcherFromUrl(
  url: string,
  connectionParams?: ClientOptions['connectionParams'],
): Promise<Fetcher | void> {
  let wsClient;
  try {
    const { createClient } =
      process.env.USE_IMPORT === 'false'
        ? (require('graphql-ws') as { createClient: typeof createClientType })
        : await import('graphql-ws');

    // TODO: defaults?
    wsClient = createClient({ url, connectionParams });
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
}

/**
 * Create ws/s fetcher using provided wsClient implementation
 */
export const createWebsocketsFetcherFromClient =
  (wsClient: Client): Fetcher =>
  (graphQLParams: FetcherParams) =>
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
 */
export const createLegacyWebsocketsFetcher =
  (legacyWsClient: { request: (params: FetcherParams) => unknown }): Fetcher =>
  (graphQLParams: FetcherParams) => {
    const observable = legacyWsClient.request(graphQLParams);
    return makeAsyncIterableIteratorFromSink<ExecutionResult>(
      // @ts-ignore
      sink => observable.subscribe(sink).unsubscribe,
    );
  };
/**
 * Create a fetcher with the `IncrementalDelivery` HTTP/S spec for
 * `@stream` and `@defer` support using `fetch-multipart-graphql`
 */
export const createMultipartFetcher = (
  options: CreateFetcherOptions,
  httpFetch: typeof fetch,
): Fetcher =>
  async function* (graphQLParams: FetcherParams, fetcherOpts?: FetcherOpts) {
    const headers = [
      new Headers({
        'content-type': 'application/json',
        accept: 'application/json, multipart/mixed',
      }),
      new Headers(options.headers ?? {}),
      new Headers(fetcherOpts?.headers ?? {}),
    ].reduce(mergeHeadersWithSetStrategy, new Headers());

    const response = await httpFetch(options.url, {
      method: 'POST',
      body: JSON.stringify(graphQLParams),
      headers,
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
 */
export async function getWsFetcher(
  options: CreateFetcherOptions,
  fetcherOpts?: FetcherOpts,
): Promise<Fetcher | void> {
  if (options.wsClient) {
    return createWebsocketsFetcherFromClient(options.wsClient);
  }
  if (options.subscriptionUrl) {
    const fetcherOptsHeaders = new Headers(fetcherOpts?.headers ?? {});
    // @ts-expect-error: Current TS Config target does not support `Headers.entries()` method.
    // However it is reported as "widely available" and so should be fine to use. This could
    // would be more complicated without it.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Headers/entries
    const fetcherOptsHeadersEntries: [string, string][] = [
      ...fetcherOptsHeaders.entries(),
    ];
    // todo: If there are headers with multiple values, they will be lost. Is this a problem?
    const fetcherOptsHeadersRecord = Object.fromEntries(
      fetcherOptsHeadersEntries,
    );
    return createWebsocketsFetcherFromUrl(options.subscriptionUrl, {
      ...options.wsConnectionParams,
      ...fetcherOptsHeadersRecord,
    });
  }
  const legacyWebsocketsClient = options.legacyClient || options.legacyWsClient;
  if (legacyWebsocketsClient) {
    return createLegacyWebsocketsFetcher(legacyWebsocketsClient);
  }
}
