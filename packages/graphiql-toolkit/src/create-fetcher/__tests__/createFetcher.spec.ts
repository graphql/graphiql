/* eslint-disable */

import { parse } from 'graphql';
import { createGraphiQLFetcher } from '../createFetcher';
import { test } from './_helpers';

interface TestCase {
  constructor: HeadersInit;
  send: HeadersInit;
  expected: Record<string, string>;
}

const H = Headers;
const cases: TestCase[] = [
  // --- levels merge
  { constructor: { a:'1' }      , send: { b:'2' }      , expected: { a:'1', b:'2' } },
  { constructor: [['a','1']]    , send: [['b','2']]    , expected: { a:'1', b:'2' } },
  { constructor: new H({a:'1'}) , send: new H({b:'2'}) , expected: { a:'1', b:'2' } },
  // --- send level takes precedence
  { constructor: { a:'1' }      , send: { a:'2' }      , expected: { a:'2' } },
  { constructor: [['a','1']]    , send: [['a','2']]    , expected: { a:'2' } },
  { constructor: new H({a:'1'}) , send: new H({a:'2'}) , expected: { a:'2' } },
]; // prettier-ignore

describe('accepts HeadersInit on constructor and send levels, send taking precedence', () => {
  test.for(cases)('%j', async (_case, { fetch }) => {
    const fetcher = createGraphiQLFetcher({
      url: 'https://foobar',
      enableIncrementalDelivery: false,
      headers: _case.constructor,
    });
    await fetcher({ query: '' }, { headers: _case.send });
    // @ts-expect-error
    const requestHeaders = Object.fromEntries(new Headers(fetch.mock.calls[0]?.[1]?.headers ?? {}).entries()); // prettier-ignore
    expect(fetch).toBeCalledTimes(1);
    expect(requestHeaders).toMatchObject(_case.expected);
  });

  test.for(cases)('incremental delivery: %j', async (_case, { fetch }) => {
    const fetcher = createGraphiQLFetcher({
      url: 'https://foobar',
      enableIncrementalDelivery: true,
      headers: _case.constructor,
    });
    const result = await fetcher({ query: '' }, { headers: _case.send });
    // TODO: Improve types to indicate that result is AsyncIterable when enableIncrementalDelivery is true
    await drainAsyncIterable(result as AsyncIterable<any>);
    // @ts-expect-error
    const requestHeaders = Object.fromEntries(new Headers(fetch.mock.calls[0]?.[1]?.headers ?? {}).entries()); // prettier-ignore
    expect(fetch).toBeCalledTimes(1);
    expect(requestHeaders).toMatchObject(_case.expected);
  });

  test.for(cases)('subscription: %j', async (_case, { graphqlWs }) => {
    const fetcher = createGraphiQLFetcher({
      url: 'https://foobar',
      headers: _case.constructor,
      subscriptionUrl: 'wss://foobar',
    });
    await fetcher({ query: '', operationName:'foo' }, { headers: _case.send, documentAST: parse('subscription foo { bar }') }); // prettier-ignore
    const connectionParams = graphqlWs.createClient.mock.calls[0]?.[0]?.connectionParams ?? {}; // prettier-ignore
    expect(graphqlWs.createClient).toBeCalledTimes(1);
    expect(connectionParams).toMatchObject(_case.expected);
  });
});

// -------------------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------------------

const drainAsyncIterable = async (iterable: AsyncIterable<any>) => {
  const result: any[] = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
};
