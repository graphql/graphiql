import { ExecutionResult } from 'graphql';
import { createClient, RequestParams } from 'graphql-http';

import type { CreateFetcherOptions, Fetcher } from './types';

/**
 * build a GraphiQL fetcher that is:
 * - backwards compatible
 * - optionally supports graphql-ws or `
 *
 * @param options {CreateFetcherOptions}
 * @returns {Fetcher}
 */
export function createGraphiQLFetcher(options: CreateFetcherOptions): Fetcher {
  const client = createClient(options);

  function execute<Data, Extensions>(
    params: RequestParams,
  ): Promise<ExecutionResult<Data, Extensions>> {
    // let cancel!: () => void;
    const request = new Promise<ExecutionResult<Data, Extensions>>(
      (resolve, reject) => {
        let result: ExecutionResult<Data, Extensions>;
        client.subscribe<Data, Extensions>(params, {
          next: data => (result = data),
          error: reject,
          complete: () => resolve(result),
        });
      },
    );
    return request;
  }

  // todo: handle cancellation
  return execute;
}
