import { Json } from 'queryExecutor';

type FetcherArgs = {
  uri: string;
  query: string;
  operationName?: string;
  variables?: unknown;
  requestOpts?: RequestInit;
};

export async function graphQLHttpFetcher<T extends Json>({
  requestOpts,
  uri,
  query,
  operationName,
  variables,
}: FetcherArgs): Promise<T> {
  const rawResult = await fetch(uri, {
    method: 'post',
    body: JSON.stringify({
      query,
      operationName,
      variables,
    }),
    credentials: 'omit',
    headers: requestOpts?.headers || {
      'Content-Type': 'application/json',
    },
    ...requestOpts,
  });

  const response: T = (await rawResult.json()) as T;
  return response;
}
