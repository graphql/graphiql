import type { ExecutionResult } from 'graphql';
import type { Client } from 'graphql-ws';

export type TransportRequest = {
  query: string;
  operationName?: string | null;
  variables?: Record<string, unknown>;
  /**
   * Per-request headers, merged with (and overriding) the static headers passed
   * to `createTransport`.
   */
  headers?: Record<string, string>;
};

/**
 * Per-resolver trace, if the server returns timing data (e.g. Apollo tracing).
 * Not populated yet; reserved so the response shape is stable for a later
 * trace-extension parser.
 */
export type ResolverTrace = {
  path: (string | number)[];
  parentType: string;
  fieldName: string;
  returnType: string;
  startOffsetMs: number;
  durationMs: number;
};

/**
 * A single execution result plus the wire-level metadata around it.
 *
 * `status`, `statusText` and `headers` are optional because not every
 * transport has an HTTP response envelope: a WebSocket subscription emits
 * results over a socket, and a user-supplied fetcher only ever returns the
 * parsed result. Absent fields mean "this transport can't observe it", which
 * is honest, rather than a fabricated `200`.
 */
export type TransportResponse = {
  ok: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  /**
   * A single execution result, or an array of incremental payloads for one
   * `multipart/mixed` chunk (`@defer`/`@stream`).
   */
  body: ExecutionResult | ExecutionResult[];
  timing: { totalMs: number; resolverTraces?: ResolverTrace[] };
  size: { request?: number; response?: number };
};

export type HttpMethod = 'GET' | 'POST';

/**
 * Wire-level transport. `send()` returns a single Promise for queries and
 * mutations, or an AsyncIterable for subscriptions and incremental delivery
 * (each event/chunk is wrapped in its own `TransportResponse`).
 */
export type Transport = {
  /**
   * The endpoint URL this transport sends requests to.
   */
  url: string;
  /**
   * Currently active HTTP method.
   */
  method: HttpMethod;
  /**
   * HTTP methods this transport is configured to use. Defaults to `['POST']`.
   */
  supportedMethods: HttpMethod[];
  /**
   * Present only when `supportedMethods` has more than one entry. Switches the
   * active HTTP method used by subsequent `send()` calls.
   */
  setMethod?: (method: HttpMethod) => void;
  send(
    request: TransportRequest,
  ): Promise<TransportResponse> | AsyncIterable<TransportResponse>;
};

export type CreateTransportOptions = {
  /**
   * URL for HTTP(S) requests. Required.
   */
  url: string;
  /**
   * Static request headers, merged with (and overridable by) per-request headers.
   */
  headers?: Record<string, string>;
  /**
   * A pre-built subscription client whose `.subscribe(payload, sink)` matches
   * the `graphql-ws` `Client` shape. `graphql-sse`'s `createClient()` is
   * signature-compatible, so SSE subscriptions work without any SSE-specific
   * code in the toolkit.
   *
   * Construct the client yourself and pass it in; the toolkit does not build
   * one for you. If a subscription is sent without this option configured,
   * `send()` throws.
   */
  subscriptionClient?: Client;
  /**
   * Use `multipart/mixed` incremental delivery for `@defer`/`@stream`.
   * Defaults to true.
   */
  enableIncrementalDelivery?: boolean;
  /**
   * Custom fetch implementation. Defaults to the global fetch.
   */
  fetch?: typeof fetch;
  /**
   * Initial HTTP method to use for queries. Defaults to `'POST'`.
   * When set to `'GET'`, queries are encoded into the URL per the
   * GraphQL over HTTP spec; mutations always use POST regardless.
   */
  method?: HttpMethod;
  /**
   * HTTP methods this transport should advertise as supported.
   * Defaults to `['POST']`. Pass `['GET', 'POST']` to allow switching.
   */
  supportedMethods?: HttpMethod[];
};
