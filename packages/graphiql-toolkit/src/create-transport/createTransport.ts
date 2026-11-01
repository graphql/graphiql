import { parse } from 'graphql';
import type {
  FormattedExecutionResult,
  OperationDefinitionNode,
} from 'graphql';
import {
  multipartHttpTransport,
  simpleHttpTransport,
} from '../create-fetcher/lib';
import type {
  CreateFetcherOptions,
  FetcherOpts,
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

/**
 * Parse the query once and classify the selected operation, rather than
 * parsing separately to check for a subscription and again to check for a
 * mutation. Returns `undefined` for an unparseable query or when the
 * selected operation can't be resolved (no `operationName` match, or more
 * than one operation with none specified).
 */
function classifySelectedOperation(
  query: string,
  operationName?: string | null,
): 'query' | 'mutation' | 'subscription' | undefined {
  let document;
  try {
    document = parse(query);
  } catch {
    return undefined;
  }
  const operations = document.definitions.filter(
    (def): def is OperationDefinitionNode => def.kind === 'OperationDefinition',
  );
  const operation = operationName
    ? operations.find(op => op.name?.value === operationName)
    : operations.length === 1
      ? operations[0]
      : undefined;
  return operation?.operation;
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

  const initialMethod = opts.method ?? 'POST';
  let supportedMethods = opts.supportedMethods?.slice() ?? [initialMethod];
  if (!supportedMethods.length) {
    throw new Error('supportedMethods must contain at least one HTTP method.');
  }
  let methodOverride = opts.method;
  const listeners = new Set<() => void>();
  let discovery: { key: string; result: Promise<HttpMethod[]> } | undefined;

  function notify() {
    // A listener may unsubscribe and resubscribe itself during notification.
    // oxlint-disable-next-line unicorn/no-useless-spread
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        // Observing transport state must not interrupt request execution.
        // eslint-disable-next-line no-console
        console.error('GraphiQL: a transport state listener threw:', error);
      }
    }
  }

  function discover(headers: Record<string, string>): Promise<HttpMethod[]> {
    const key = JSON.stringify(Object.entries(headers).sort());
    if (discovery?.key === key) {
      return discovery.result;
    }
    // Keep only the latest context. A response for older credentials must not
    // overwrite the capabilities currently shown to the caller.
    const current = {
      key,
      result: probeMethods(httpFetch, opts.url, headers, initialMethod),
    };
    discovery = current;
    current.result = (async () => {
      const methods = await current.result;
      if (
        discovery === current &&
        (methods.length !== supportedMethods.length ||
          methods.some((method, index) => method !== supportedMethods[index]))
      ) {
        supportedMethods = methods;
        notify();
      }
      return methods;
    })();
    return current.result;
  }

  function send(
    req: TransportRequest,
  ): Promise<TransportResponse> | AsyncIterable<TransportResponse> {
    const params: FetcherParams = {
      query: req.query,
      operationName: req.operationName ?? undefined,
      variables: req.variables,
      extensions: req.extensions,
    };
    const selectedOperation = classifySelectedOperation(
      req.query,
      req.operationName,
    );
    if (selectedOperation === 'subscription') {
      return subscribe(opts.subscriptionClient, params);
    }

    const selectedOverride = methodOverride;
    const headers = new Headers(opts.headers);
    for (const [name, value] of Object.entries(req.headers ?? {})) {
      headers.set(name, value);
    }
    const effectiveHeaders: Record<string, string> = {};
    headers.forEach((value, name) => {
      effectiveHeaders[name] = value;
    });
    const fetcherOptions: CreateFetcherOptions = { url: opts.url };
    const fetcherOpts: FetcherOpts = {
      headers: effectiveHeaders,
      signal: req.signal,
    };

    function executionMethod(methods: HttpMethod[]) {
      if (!methods.length) {
        throw new Error(
          'This endpoint advertises no supported GraphQL HTTP methods.',
        );
      }
      if (selectedOperation !== 'query') {
        if (!methods.includes('POST')) {
          const operation =
            selectedOperation === 'mutation'
              ? 'a mutation'
              : 'an unclassified operation';
          throw new Error(
            `Cannot execute ${operation} over ${methods.join(', ')}. ` +
              'This transport does not support POST.',
          );
        }
        return 'POST';
      }
      const method = selectedOverride ?? preferredMethod(methods);
      if (!methods.includes(method)) {
        throw new Error(
          `"${method}" is not supported by this transport (supportedMethods: ${methods.join(', ')}).`,
        );
      }
      return method;
    }

    // Explicit capabilities retain synchronous validation and skip discovery.
    if (opts.supportedMethods) {
      throwIfAborted(req.signal);
      const method = executionMethod(supportedMethods);
      return incrementalDelivery
        ? multipartHttpTransport(
            fetcherOptions,
            httpFetch,
            method,
          )(params, fetcherOpts)
        : simpleHttpTransport(
            fetcherOptions,
            httpFetch,
            method,
          )(params, fetcherOpts);
    }

    async function prepare(signal?: AbortSignal) {
      throwIfAborted(signal);
      const methods = await waitForDiscovery(
        discover(effectiveHeaders),
        signal,
      );
      throwIfAborted(signal);
      return executionMethod(methods);
    }

    if (!incrementalDelivery) {
      return (async () => {
        const method = await prepare(req.signal);
        throwIfAborted(req.signal);
        return simpleHttpTransport(
          fetcherOptions,
          httpFetch,
          method,
        )(params, fetcherOpts);
      })();
    }

    // An async generator alone queues return() behind a pending next(). Abort
    // the wait first so closing an iterator cannot send an unwanted operation.
    const controller = new AbortController();
    const abort = () => controller.abort(req.signal?.reason);
    const iterator = (async function* () {
      if (req.signal?.aborted) {
        abort();
      }
      req.signal?.addEventListener('abort', abort, { once: true });
      try {
        const method = await prepare(controller.signal);
        throwIfAborted(controller.signal);
        yield* multipartHttpTransport(
          fetcherOptions,
          httpFetch,
          method,
        )(params, {
          ...fetcherOpts,
          signal: controller.signal,
        });
      } finally {
        req.signal?.removeEventListener('abort', abort);
      }
    })();
    return {
      next: () => iterator.next(),
      return() {
        controller.abort();
        return iterator.return();
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    } as AsyncIterableIterator<TransportResponse>;
  }

  const transport: Transport = {
    url: opts.url,
    get method() {
      return (
        methodOverride ??
        (supportedMethods.length
          ? preferredMethod(supportedMethods)
          : initialMethod)
      );
    },
    get supportedMethods() {
      return supportedMethods;
    },
    get methodOverride() {
      return methodOverride;
    },
    send,
    setMethod(method) {
      if (methodOverride === method) {
        return;
      }
      methodOverride = method;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return transport;
}

function preferredMethod(methods: HttpMethod[]): HttpMethod {
  return methods.includes('QUERY')
    ? 'QUERY'
    : methods.includes('POST')
      ? 'POST'
      : 'GET';
}

function parseAllow(value: string | null): HttpMethod[] | undefined {
  if (value === null) {
    return undefined;
  }
  const methods = value
    .split(',')
    .map(method => method.replaceAll(/^[ \t]+|[ \t]+$/g, ''))
    .filter(Boolean);
  // HTTP method tokens are case-sensitive. Empty list elements are permitted
  // by HTTP's list syntax, but malformed tokens make discovery unavailable.
  if (methods.some(method => !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(method))) {
    return undefined;
  }
  return (['GET', 'POST', 'QUERY'] as const).filter(method =>
    methods.includes(method),
  );
}

async function probeMethods(
  httpFetch: typeof fetch,
  url: string,
  headers: Record<string, string>,
  initialMethod: HttpMethod,
): Promise<HttpMethod[]> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      httpFetch(url, { method: 'OPTIONS', headers, signal: controller.signal }),
      new Promise<void>(resolve => {
        timeout = setTimeout(() => {
          resolve();
          controller.abort();
        }, 2000);
      }),
    ]);
    if (response?.ok) {
      return parseAllow(response.headers.get('allow')) ?? [initialMethod];
    }
  } catch {
    // OPTIONS is optional and may be blocked by servers or CORS policies.
  } finally {
    clearTimeout(timeout);
    // Only response headers are needed; stop any remaining OPTIONS body.
    controller.abort();
  }
  return [initialMethod];
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw (
      signal.reason ??
      new DOMException('The request was aborted.', 'AbortError')
    );
  }
}

async function waitForDiscovery<T>(
  result: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!signal) {
    return result;
  }
  let abort: () => void = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    abort = () =>
      reject(
        signal.reason ??
          new DOMException('The request was aborted.', 'AbortError'),
      );
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
    }
  });
  try {
    return await Promise.race([result, aborted]);
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

function subscribe(
  subscriptionClient: SubscriptionClient | undefined,
  params: FetcherParams,
): AsyncIterableIterator<TransportResponse> {
  let source: AsyncIterableIterator<FormattedExecutionResult> | undefined;
  let closed = false;
  let startMs = 0;

  const getSource = () => {
    if (!subscriptionClient) {
      throw new Error(
        "createTransport is not configured for subscriptions. Pass a `subscriptionClient` (e.g. `graphql-ws`'s `createClient({ url })` or `graphql-sse`'s `createClient({ url })`). See docs/migration/graphiql-6.0.0.md.",
      );
    }
    if (!source) {
      startMs = performance.now();
      source = subscriptionClient.iterate(params);
    }
    return source;
  };

  const closeSource = async () => {
    if (!closed) {
      closed = true;
      await source?.return?.();
    }
  };

  return {
    async next() {
      if (closed) {
        return { done: true, value: undefined };
      }
      try {
        const result = await getSource().next();
        if (result.done) {
          closed = true;
          return { done: true, value: undefined };
        }
        return {
          done: false,
          value: toSubscriptionResponse(result.value, startMs),
        };
      } catch (error) {
        try {
          await closeSource();
        } catch {
          // Preserve the error that ended iteration.
        }
        throw error;
      }
    },
    async return() {
      await closeSource();
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}
