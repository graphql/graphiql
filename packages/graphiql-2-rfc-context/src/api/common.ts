/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { SchemaConfig, Fetcher } from '../types';
import { GraphQLParams } from './types';

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
