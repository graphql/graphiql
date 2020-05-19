import { graphQLHttpFetcher } from './fetcher';
import {
  IntrospectionOptions,
  getIntrospectionQuery,
  IntrospectionQuery,
} from 'graphql';
import { SchemaLoader } from 'schemaLoader';
import { Json } from 'queryExecutor';

export type HttpSchemaLoaderConfig = {
  uri: string;
  requestOpts?: RequestInit;
  introspectionOptions?: IntrospectionOptions;
};

export function createHttpSchemaLoader(
  config: HttpSchemaLoaderConfig,
): SchemaLoader {
  const { requestOpts, uri, introspectionOptions } = config;
  return async () => {
    const introspectionResponse = await graphQLHttpFetcher<
      { data: IntrospectionQuery } & Json
    >({
      requestOpts,
      uri,
      operationName: 'IntrospectionQuery',
      query: getIntrospectionQuery(introspectionOptions),
    });

    return introspectionResponse?.data;
  };
}
