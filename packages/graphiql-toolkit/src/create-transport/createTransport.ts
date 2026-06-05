import { parse } from 'graphql';
import type { OperationDefinitionNode } from 'graphql';
import { isAsyncIterable } from '@n1ru4l/push-pull-async-iterable-iterator';
import {
  getWsFetcher,
  multipartHttpTransport,
  simpleHttpTransport,
} from '../create-fetcher/lib';
import type { CreateFetcherOptions, FetcherParams } from '../create-fetcher/types';
import type {
  CreateTransportOptions,
  Transport,
  TransportRequest,
  TransportResponse,
} from './types';

function selectedOperationIsSubscription(
  query: string,
  operationName?: string | null,
): boolean {
  let document;
  try {
    document = parse(query);
  } catch {
    return false;
  }
  const operations = document.definitions.filter(
    (def): def is OperationDefinitionNode =>
      def.kind === 'OperationDefinition',
  );
  const operation = operationName
    ? operations.find(op => op.name?.value === operationName)
    : operations.length === 1
      ? operations[0]
      : undefined;
  return operation?.operation === 'subscription';
}

const byteLength = (value: string): number =>
  typeof TextEncoder === 'undefined'
    ? value.length
    : new TextEncoder().encode(value).length;

/**
 * Wrap one subscription event. A socket has no HTTP response, so `status`,
 * `statusText` and `headers` are intentionally absent.
 */
function toSubscriptionResponse(
  event: unknown,
  startMs: number,
): TransportResponse {
  const errors = (event as { errors?: unknown } | null)?.errors;
  return {
    ok: !Array.isArray(errors) || errors.length === 0,
    body: event as TransportResponse['body'],
    timing: { totalMs: performance.now() - startMs },
    size: { response: byteLength(JSON.stringify(event)) },
  };
}

/**
 * Create a `Transport`: the wire-level primitive that owns the request and
 * surfaces structured response metadata.
 *
 * `createGraphiQLFetcher` is a body-only projection of the same underlying HTTP
 * helpers, so anything routed through this toolkit shares one source of truth
 * for status, headers, timing and size.
 *
 * - Queries / mutations: `send()` returns `Promise<TransportResponse>` when
 *   incremental delivery is off, or an `AsyncIterable<TransportResponse>`
 *   (one chunk per payload) when it is on.
 * - Subscriptions: `send()` returns an `AsyncIterable<TransportResponse>`,
 *   one event at a time.
 */
export function createTransport(opts: CreateTransportOptions): Transport {
  const httpFetch =
    opts.fetch || (typeof window !== 'undefined' && window.fetch);
  if (!httpFetch) {
    throw new Error('No valid fetch implementation available');
  }

  const incrementalDelivery = opts.enableIncrementalDelivery !== false;

  const fetcherOptions: CreateFetcherOptions = {
    url: opts.url,
    headers: opts.headers,
    subscriptionUrl: opts.subscriptionUrl,
    wsClient: opts.wsClient,
    legacyClient: opts.legacyClient,
    wsConnectionParams: opts.wsConnectionParams,
  };

  const simple = simpleHttpTransport(fetcherOptions, httpFetch);
  const multipart = multipartHttpTransport(fetcherOptions, httpFetch);

  function send(
    req: TransportRequest,
  ): Promise<TransportResponse> | AsyncIterable<TransportResponse> {
    const params: FetcherParams = {
      query: req.query,
      operationName: req.operationName ?? undefined,
      variables: req.variables,
    };
    const fetcherOpts = req.headers ? { headers: req.headers } : undefined;

    if (selectedOperationIsSubscription(req.query, req.operationName)) {
      return subscribe(fetcherOptions, params, fetcherOpts);
    }
    if (incrementalDelivery) {
      return multipart(params, fetcherOpts);
    }
    return simple(params, fetcherOpts);
  }

  return { send };
}

async function* subscribe(
  fetcherOptions: CreateFetcherOptions,
  params: FetcherParams,
  fetcherOpts?: { headers?: Record<string, string> },
): AsyncGenerator<TransportResponse> {
  const wsFetcher = await getWsFetcher(fetcherOptions, fetcherOpts);
  if (!wsFetcher) {
    throw new Error(
      'createTransport is not configured for subscriptions. Provide `subscriptionUrl`, `wsClient`, or `legacyClient`.',
    );
  }
  const result = wsFetcher(params);
  const iterable = (
    isAsyncIterable(result) ? result : await result
  ) as AsyncIterable<unknown>;
  const startMs = performance.now();
  for await (const event of iterable) {
    yield toSubscriptionResponse(event, startMs);
  }
}
