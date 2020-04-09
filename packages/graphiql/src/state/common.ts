import {
  buildClientSchema,
  ExecutionResult,
  IntrospectionQuery,
} from 'graphql';

import {
  introspectionQuery,
  introspectionQueryName,
} from '../utility/introspectionQueries';

import { SchemaConfig, GraphQLParams, Fetcher } from './types';
import { observableToPromise } from '../utility/observableToPromise';

export async function fetchSchema(fetcher: Fetcher) {
  const rawResult = fetcher({
    query: introspectionQuery,
    operationName: introspectionQueryName,
  });
  const introspectionResponse = await observableToPromise(rawResult);

  if (!introspectionResponse || !introspectionResponse.data) {
    throw Error('error fetching introspection schema');
  }
  return buildClientSchema(introspectionResponse.data as IntrospectionQuery, {
    assumeValid: true,
  });
}

export function getDefaultFetcher(schemaConfig: SchemaConfig): Fetcher {
  return async function defaultFetcher(graphqlParams: GraphQLParams) {
    try {
      const rawResult = await fetch(schemaConfig.uri!, {
        method: 'post',
        body: JSON.stringify(graphqlParams),
        headers: { 'Content-Type': 'application/json', credentials: 'omit' },
      });
      return rawResult.json() as ExecutionResult;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}

export function getFetcher(fetcher?: Fetcher, uri?: string): Fetcher {
  if (fetcher) {
    return fetcher;
  }

  if (uri) {
    return getDefaultFetcher({ uri });
  }

  throw new Error('Must provide either a fetcher or a uri');
}
