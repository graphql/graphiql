import type { ExecutionResult } from 'graphql';
import type { Client, ClientOptions } from 'graphql-ws';

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

/**
 * Wire-level transport. `send()` returns a single Promise for queries and
 * mutations, or an AsyncIterable for subscriptions and incremental delivery
 * (each event/chunk is wrapped in its own `TransportResponse`).
 */
export type Transport = {
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
   * URL for subscription requests. Used to create a `graphql-ws` client when no
   * `wsClient`/`legacyClient` is provided.
   */
  subscriptionUrl?: string;
  /**
   * A pre-built client with a `graphql-ws`-compatible `subscribe()` signature.
   * `graphql-sse`'s `createClient()` satisfies this, so passing it here routes
   * subscriptions over SSE without any SSE-specific code in the toolkit.
   */
  wsClient?: Client;
  /**
   * A legacy `subscriptions-transport-ws`-style client.
   */
  legacyClient?: { request: (params: unknown) => unknown };
  /**
   * Connection params forwarded to the `graphql-ws` client created from
   * `subscriptionUrl`.
   */
  wsConnectionParams?: ClientOptions['connectionParams'];
  /**
   * Use `multipart/mixed` incremental delivery for `@defer`/`@stream`.
   * Defaults to true, matching `createGraphiQLFetcher`.
   */
  enableIncrementalDelivery?: boolean;
  /**
   * Custom fetch implementation. Defaults to the global fetch.
   */
  fetch?: typeof fetch;
};
