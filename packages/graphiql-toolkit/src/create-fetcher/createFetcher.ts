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
 */
export function createGraphiQLFetcher(options: CreateFetcherOptions): Fetcher {
  const httpFetch =
    options.fetch || (typeof window !== 'undefined' && window.fetch);
  if (!httpFetch) {
    throw new Error('No valid fetcher implementation available');
  }
  options.enableIncrementalDelivery =
    options.enableIncrementalDelivery !== false;
  // simpler fetcher for schema requests
  const simpleFetcher = createSimpleFetcher(options, httpFetch);

  const httpFetcher = options.enableIncrementalDelivery
    ? createMultipartFetcher(options, httpFetch)
    : simpleFetcher;

  return async (graphQLParams, fetcherOpts) => {
    if (graphQLParams.operationName === 'IntrospectionQuery') {
      return (options.schemaFetcher || simpleFetcher)(
        graphQLParams,
        fetcherOpts,
      );
    }
    const isSubscription = fetcherOpts?.documentAST
      ? isSubscriptionWithName(
          fetcherOpts.documentAST,
          graphQLParams.operationName || undefined,
        )
      : false;
    if (isSubscription) {
      const wsFetcher = await getWsFetcher(options, fetcherOpts);

      if (!wsFetcher) {
        throw new Error(
          `Your GraphiQL createFetcher is not properly configured for websocket subscriptions yet. ${
            options.subscriptionUrl
              ? `Provided URL ${options.subscriptionUrl} failed`
              : 'Please provide subscriptionUrl, wsClient or legacyClient option first.'
          }`,
        );
      }
      return wsFetcher(graphQLParams);
    }
    return httpFetcher(graphQLParams, fetcherOpts);
  };
}
