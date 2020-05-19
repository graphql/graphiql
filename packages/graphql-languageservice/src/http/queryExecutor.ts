import { QueryExecutor, QueryExecutorArgs } from 'queryExecutor';
import { graphQLHttpFetcher } from './fetcher';

export type HttpQueryExecutorConfig = {
  requestOpts?: RequestInit;
  uri: string;
};

export function createHttpQueryExecutor(
  config: HttpQueryExecutorConfig,
): QueryExecutor {
  const { uri, requestOpts } = config;
  return (args: QueryExecutorArgs) => {
    const { query, operationName, variables } = args;
    return graphQLHttpFetcher({
      requestOpts,
      uri,
      operationName,
      query,
      variables,
    });
  };
}
