import { parse } from 'graphql';
import type { OperationDefinitionNode } from 'graphql';
import {
  createWebsocketsFetcherFromClient,
  multipartHttpTransport,
  simpleHttpTransport,
} from '../create-fetcher/lib';
import type {
  CreateFetcherOptions,
  FetcherParams,
} from '../create-fetcher/types';
import type {
  CreateTransportOptions,
  HttpMethod,
  SubscriptionClient,
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
    (def): def is OperationDefinitionNode => def.kind === 'OperationDefinition',
  );
  const operation = operationName
    ? operations.find(op => op.name?.value === operationName)
    : operations.length === 1
      ? operations[0]
      : undefined;
  return operation?.operation === 'subscription';
}

function selectedOperationIsMutation(
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
    (def): def is OperationDefinitionNode => def.kind === 'OperationDefinition',
  );
  const operation = operationName
    ? operations.find(op => op.name?.value === operationName)
    : operations.length === 1
      ? operations[0]
      : undefined;
  return operation?.operation === 'mutation';
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
 * - Queries / mutations: `send()` returns `Promise<TransportResponse>` when
 *   incremental delivery is off, or an `AsyncIterable<TransportResponse>`
 *   (one chunk per payload) when it is on.
 * - Subscriptions: `send()` returns an `AsyncIterable<TransportResponse>`,
 *   one event at a time. A `subscriptionClient` must be configured; the
 *   toolkit does not construct one for you.
 */
export function createTransport(opts: CreateTransportOptions): Transport {
  const httpFetchOrFalse =
    opts.fetch || (typeof window !== 'undefined' && window.fetch);
  if (!httpFetchOrFalse) {
    throw new Error('No valid fetch implementation available');
  }
  const httpFetch: typeof fetch = httpFetchOrFalse;

  const incrementalDelivery = opts.enableIncrementalDelivery !== false;

  const fetcherOptions: CreateFetcherOptions = {
    url: opts.url,
    headers: opts.headers,
  };

  const supportedMethods: HttpMethod[] = opts.supportedMethods ?? ['POST'];

  if (opts.method !== undefined && !supportedMethods.includes(opts.method)) {
    throw new Error(
      `"${opts.method}" is not in supportedMethods (${supportedMethods.join(', ')}). ` +
        `Either add it to supportedMethods or omit the method option.`,
    );
  }

  // Default to POST when available; otherwise fall back to whichever single
  // method was configured (e.g. GET-only).
  let activeMethod: HttpMethod =
    opts.method ??
    (supportedMethods.includes('POST') ? 'POST' : supportedMethods[0]);

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
      return subscribe(opts.subscriptionClient, params);
    }

    // Mutations may only be sent over POST. GET and QUERY are both safe methods
    // (https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/),
    // and the GraphQL over HTTP spec forbids mutations over GET; the same safety
    // reasoning applies to QUERY. When a safe method is active and the operation
    // is a mutation, use POST if it is available. If POST is not supported,
    // throw — a spec-compliant server would reject the request anyway.
    let method: HttpMethod = activeMethod;
    if (
      activeMethod !== 'POST' &&
      selectedOperationIsMutation(req.query, req.operationName)
    ) {
      if (!supportedMethods.includes('POST')) {
        throw new Error(
          `Cannot execute a mutation over ${activeMethod}. ` +
            `This transport does not support POST (supportedMethods: ${supportedMethods.join(', ')}). ` +
            'Add POST to supportedMethods or switch to a POST-capable transport.',
        );
      }
      method = 'POST';
    }

    if (incrementalDelivery) {
      return multipartHttpTransport(
        fetcherOptions,
        httpFetch,
        method,
      )(params, fetcherOpts);
    }
    return simpleHttpTransport(
      fetcherOptions,
      httpFetch,
      method,
    )(params, fetcherOpts);
  }

  const transport: Transport = {
    url: opts.url,
    method: activeMethod,
    supportedMethods,
    send,
  };

  if (supportedMethods.length > 1) {
    transport.setMethod = (method: HttpMethod) => {
      if (!supportedMethods.includes(method)) {
        throw new Error(
          `"${method}" is not supported by this transport (supportedMethods: ${supportedMethods.join(', ')}).`,
        );
      }
      activeMethod = method;
      transport.method = method;
    };
  }

  return transport;
}

async function* subscribe(
  subscriptionClient: SubscriptionClient | undefined,
  params: FetcherParams,
): AsyncGenerator<TransportResponse> {
  if (!subscriptionClient) {
    throw new Error(
      "createTransport is not configured for subscriptions. Pass a `subscriptionClient` (e.g. `graphql-ws`'s `createClient({ url })` or `graphql-sse`'s `createClient({ url })`). See docs/migration/graphiql-6.0.0.md.",
    );
  }
  const wsFetcher = createWebsocketsFetcherFromClient(subscriptionClient);
  const iterable = wsFetcher(params) as AsyncIterable<unknown>;
  const startMs = performance.now();
  for await (const event of iterable) {
    yield toSubscriptionResponse(event, startMs);
  }
}
