import type { Fetcher, CreateFetcherOptions } from './types';

import {
  createMultipartFetcher,
  createSimpleFetcher,
  isSubscriptionWithName,
  getWsFetcher,
} from './lib';

/**
 * build a GraphiQL fetcher that is:
 * - backwards compatible
 * - optionally supports graphql-ws or `
 *
 * @param options {CreateFetcherOptions}
 * @returns {Fetcher}
 */
export function createGraphiQLFetcher(options: CreateFetcherOptions): Fetcher {
  let httpFetch;
  if (typeof window !== 'undefined' && window.fetch) {
    httpFetch = window.fetch;
  }
  if (
    options?.enableIncrementalDelivery === null ||
    options.enableIncrementalDelivery !== false
  ) {
    options.enableIncrementalDelivery = true;
  }
  if (options.fetch) {
    httpFetch = options.fetch;
  }
  if (!httpFetch) {
    throw Error('No valid fetcher implementation available');
  }
  // simpler fetcher for schema requests
  const simpleFetcher = createSimpleFetcher(options, httpFetch);

  const wsFetcher = getWsFetcher(options);
  const httpFetcher = options.enableIncrementalDelivery
    ? createMultipartFetcher(options, httpFetch)
    : simpleFetcher;

  return (graphQLParams, fetcherOpts) => {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return (options.schemaFetcher || simpleFetcher)(
        graphQLParams,
        fetcherOpts,
      );
    }
    const isSubscription = isSubscriptionWithName(
      fetcherOpts?.documentAST!,
      graphQLParams.operationName || undefined,
    );
    if (isSubscription) {
      if (!wsFetcher) {
        throw Error(
          `Your GraphiQL createFetcher is not properly configured for websocket subscriptions yet. ${
            options.subscriptionUrl
              ? `Provided URL ${options.subscriptionUrl} failed`
              : `Please provide subscriptionUrl, wsClient or legacyClient option first.`
          }`,
        );
      }
      return wsFetcher(graphQLParams);
    }
    return httpFetcher(graphQLParams, fetcherOpts);
  };
}
