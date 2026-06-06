import type { Fetcher, CreateFetcherOptions } from './types';

import {
  createMultipartFetcher,
  createSimpleFetcher,
  isSubscriptionWithName,
  getSubscriptionFetcher,
} from './lib';

/**
 * build a GraphiQL fetcher that is:
 * - backwards compatible
 * - optionally supports GraphQL over SSE, graphql-ws, or legacy websockets
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
      const subscriptionFetcher = await getSubscriptionFetcher(
        options,
        fetcherOpts,
      );

      if (!subscriptionFetcher) {
        throw new Error(
          `Your GraphiQL createFetcher is not properly configured for subscriptions yet. ${
            options.sseUrl
              ? `Provided SSE URL ${options.sseUrl} failed`
              : options.subscriptionUrl
                ? `Provided websocket URL ${options.subscriptionUrl} failed`
                : 'Please provide sseUrl, sseClient, subscriptionUrl, wsClient or legacyClient option first.'
          }`,
        );
      }
      return subscriptionFetcher(graphQLParams);
    }
    return httpFetcher(graphQLParams, fetcherOpts);
  };
}
