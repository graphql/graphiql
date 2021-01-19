import type { Client } from 'graphql-ws'
import type { Fetcher } from '@graphiql/toolkit';
import type { BuildFetcherOptions } from './types';

import {
  createMultipartFetcher,
  createSimpleFetcher,
  isSubcriptionWithName,
  createWebsocketsClient,
  createWebsocketsFetcher,
} from './lib';




/**
 * build a GraphiQL fetcher that is:
 * - backwards compatible
 * - optionally supports graphql-ws or `
 *
 * @param options {BuildFetcherOptions}
 * @returns {Fetcher}
 */
export function buildGraphiQLFetcher(options: BuildFetcherOptions): Fetcher {
  // hoist the wsClient to global scope, so that we can unsubscribe/re-subscribe
// even when the function is re-invoked.
  let wsClient: Client | null = null;

  let httpFetch;
  if (typeof window !== null && window?.fetch) {
    httpFetch = window.fetch;
  }
  if (options?.enableMultipart === null || options.enableMultipart !== false) {
    options.enableMultipart = true;
  }
  if (options.fetch) {
    httpFetch = options.fetch;
  }
  if (!httpFetch) {
    throw Error('No valid fetcher implementation available');
  }


  let wsFetcher: Fetcher | null = null;

  // user provided wsClient
  if (options.wsClient) {
    wsClient = options.wsClient;
  }

  // if there's no user provided wsClient,
  // and a subscriptionsUrl us present, then generate one
  if (!wsClient && options.subscriptionsUrl) {
    wsClient = createWebsocketsClient(options);
  }

  if (wsClient) {
    wsFetcher = createWebsocketsFetcher(wsClient);
  } else if (options.subscriptionsUrl) {
    throw Error("subscriptions client failed to initialize")
  }

  const simpleFetcher = createSimpleFetcher(options, httpFetch);

  const httpFetcher = options.enableMultipart
    ? createMultipartFetcher(options)
    : simpleFetcher;

  return (graphQLParams, opts) => {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return simpleFetcher(graphQLParams, opts);
    }
    const isSubscription = isSubcriptionWithName(
      opts?.documentAST!,
      graphQLParams.operationName,
    );
    if (isSubscription) {
      if (!wsFetcher) {
        throw Error(
          'GraphiQL buildFetcher did not successfully build a wsFetcher',
        );
      }
      return wsFetcher(graphQLParams, opts);
    }
    return httpFetcher(graphQLParams, opts);
  };
}
