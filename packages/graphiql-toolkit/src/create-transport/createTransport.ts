import { isAsyncIterable } from '@n1ru4l/push-pull-async-iterable-iterator';
import { createGraphiQLFetcher } from '../create-fetcher';
import type {
  CreateTransportOptions,
  Transport,
  TransportRequest,
  TransportResponse,
} from './types';

function toTransportResponse(
  body: Record<string, unknown>,
  totalMs: number,
  requestSize: number,
): TransportResponse {
  const responseBody = JSON.stringify(body);
  const errors = body['errors'];
  return {
    ok: !Array.isArray(errors) || errors.length === 0,
    status: 200,
    statusText: 'OK',
    headers: {},
    body: body as TransportResponse['body'],
    timing: { totalMs },
    size: { request: requestSize, response: responseBody.length },
  };
}

/**
 * Creates a `Transport` that wraps `createGraphiQLFetcher` and exposes
 * structured request/response data.
 *
 * - Queries and mutations: `send()` returns `Promise<TransportResponse>`.
 * - Subscriptions: `send()` returns `AsyncIterable<TransportResponse>` because
 *   each subscription event is an independent execution result.
 */
export function createTransport(opts: CreateTransportOptions): Transport {
  const fetcher = createGraphiQLFetcher({
    url: opts.url,
    headers: opts.headers,
    subscriptionUrl: opts.subscriptionUrl,
    fetch: opts.fetch,
  });

  function send(
    req: TransportRequest,
  ): Promise<TransportResponse> | AsyncIterable<TransportResponse> {
    const start = performance.now();
    const requestSize = req.body?.length ?? 0;

    const result = fetcher(
      {
        query: req.query,
        operationName: req.operationName ?? undefined,
        variables: req.variables,
      },
      { headers: req.headers },
    );

    // If the fetcher already returned an AsyncIterable synchronously (e.g. a
    // WebSocket-backed subscription), wrap each item and yield it.
    if (isAsyncIterable(result as unknown)) {
      return wrapAsyncIterable(
        result as AsyncIterable<unknown>,
        start,
        requestSize,
      );
    }

    // Otherwise we have a Promise. After resolution, check whether the settled
    // value is itself an AsyncIterable (happens with some subscription
    // transports that resolve lazily).
    return Promise.resolve(result).then(resolved => {
      const totalMs = performance.now() - start;
      if (isAsyncIterable(resolved as unknown)) {
        // Return a single merged response for a lazily-resolved iterable by
        // collecting all chunks. In practice this path is exercised by
        // multipart / incremental delivery fetchers, not true subscriptions.
        return collectAndMerge(
          resolved as AsyncIterable<unknown>,
          start,
          requestSize,
        );
      }
      return toTransportResponse(
        resolved as Record<string, unknown>,
        totalMs,
        requestSize,
      );
    });
  }

  return { send };
}

async function* wrapAsyncIterable(
  iter: AsyncIterable<unknown>,
  start: number,
  requestSize: number,
): AsyncIterable<TransportResponse> {
  for await (const item of iter) {
    const totalMs = performance.now() - start;
    yield toTransportResponse(
      item as Record<string, unknown>,
      totalMs,
      requestSize,
    );
  }
}

async function collectAndMerge(
  iter: AsyncIterable<unknown>,
  start: number,
  requestSize: number,
): Promise<TransportResponse> {
  const chunks: Record<string, unknown>[] = [];
  for await (const item of iter) {
    if (Array.isArray(item)) {
      chunks.push(...(item as Record<string, unknown>[]));
    } else {
      chunks.push(item as Record<string, unknown>);
    }
  }
  const totalMs = performance.now() - start;
  const merged =
    chunks.length === 1 ? chunks[0] : { data: chunks.map(c => c['data']) };
  return toTransportResponse(merged, totalMs, requestSize);
}
