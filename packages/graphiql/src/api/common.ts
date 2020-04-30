import { buildClientSchema, IntrospectionQuery } from 'graphql';

import {
  introspectionQuery,
  introspectionQueryName,
} from '../utility/introspectionQueries';

import { SchemaConfig, Fetcher } from '../types';
import { GraphQLParams } from './types';
import { observableToPromise } from '../utility/observableToPromise';

export async function fetchSchema(fetcher: Fetcher) {
  const rawResult = fetcher({
    query: introspectionQuery,
    operationName: introspectionQueryName,
  });
  const introspectionResponse = await observableToPromise(rawResult);
  const parsedResult = JSON.parse(introspectionResponse);

  if (!parsedResult || !('data' in parsedResult)) {
    throw Error('error fetching introspection schema');
  }

  return buildClientSchema(parsedResult.data as IntrospectionQuery, {
    assumeValid: true,
  });
}

export function getDefaultFetcher(schemaConfig: SchemaConfig) {
  return async function defaultFetcher(graphqlParams: GraphQLParams) {
    try {
      const rawResult = await fetch(schemaConfig.uri, {
        method: 'post',
        body: JSON.stringify(graphqlParams),
        headers: { 'Content-Type': 'application/json', credentials: 'omit' },
      });

      const responseBody = await rawResult.json();

      if (!rawResult.ok) {
        throw responseBody;
      }

      return responseBody;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}

export function getFetcher({
  fetcher,
  uri,
}: {
  fetcher?: Fetcher;
  uri?: string;
}) {
  if (fetcher) {
    return fetcher;
  }

  if (uri) {
    return getDefaultFetcher({ uri });
  }

  throw new Error('Must provide either a fetcher or a uri');
}
