import { GraphQLOperationParameters } from 'graphiql';
import { GraphiQLFetcherOptions } from './types';

export function generateFetcher({
  uri,
  headers,
  method,
  parseResult,
  modifyOperation,
}: GraphiQLFetcherOptions) {
  if (!uri) {
    throw Error('renderGraphiQL failed: no uri specified');
  }
  return function graphQLFetcher(graphQLParams: GraphQLOperationParameters) {
    const operationBody = modifyOperation
      ? modifyOperation(graphQLParams)
      : graphQLParams;

    return fetch(uri, {
      method: method || 'post',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(operationBody),
    })
      .then((res: Response) => {
        try {
          return parseResult ? parseResult(res) : res.json();
        } catch (err) {
          return res.text();
        }
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
        throw err;
      });
  };
}
