import type { ExecutionResult, FormattedExecutionResult } from 'graphql';

export type TransportRequest = {
  query: string;
  operationName?: string | null;
  variables?: Record<string, unknown>;
  /**
   * GraphQL-over-HTTP `extensions`, e.g. for automatic persisted queries.
   * JSON-stringified into the URL for `GET`; included in the JSON request
   * body for `POST` and `QUERY`.
   */
  extensions?: Record<string, unknown>;
  /**
   * Per-request headers, merged with (and overriding) the static headers passed
   * to `createTransport`.
   */
  headers?: Record<string, string>;
  /**
   * Aborts the request. For subscriptions, prefer stopping the returned
   * `AsyncIterable` (call `.return()` on its iterator) instead — an aborted
   * signal only cancels the initial HTTP request, not an open socket.
   */
  signal?: AbortSignal;
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
  /**
   * For an HTTP response, `response.ok && !hasGraphQLErrors` — a 401, 500, etc.
   * is `ok: false` even if the body happens to parse as JSON with no `errors`.
   * For transports with no HTTP envelope (a subscription event over a socket),
   * this is purely `!hasGraphQLErrors`, since there is no status to consult.
   */
  ok: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  /**
   * A single execution result, or an array of incremental payloads for one
   * `multipart/mixed` chunk (`@defer`/`@stream`).
   */
  body: ExecutionResult | ExecutionResult[];
  timing: { totalMs: number };
  size: { request?: number; response?: number };
};

/**
 * HTTP methods a transport can use for query operations.
 *
 * - `POST` sends the operation in a JSON request body.
 * - `GET` encodes the operation into the URL (no body); safe and cacheable,
 *   but subject to URL length limits.
 * - `QUERY` sends a JSON request body like `POST`, but is safe and idempotent
 *   like `GET` (per the HTTP QUERY method), so responses stay cacheable. See
 *   https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/
 *
 * Mutations may only be sent over `POST`, since `GET` and `QUERY` are safe.
 */
export type HttpMethod = 'GET' | 'POST' | 'QUERY';

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

/**
 * The GraphQL request handed to {@link SubscriptionClient.iterate}. Carries
 * only the operation itself — transport concerns such as per-request headers
 * are not part of the subscription contract.
 */
export type SubscriptionRequest = {
  query: string;
  operationName?: string | null;
  variables?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
};

/**
 * The subscription-client contract the transport depends on: a single
 * `iterate(request)` method returning the subscription's async iterator.
 *
 * This is intentionally the smallest shape that both `graphql-ws`'s and
 * `graphql-sse`'s `createClient()` already satisfy, so either drops in with no
 * wrapping. Calling `.return()` on the iterator must promptly stop the
 * underlying subscription and settle any pending `.next()` call.
 */
export type SubscriptionClient = {
  iterate(
    request: SubscriptionRequest,
  ): AsyncIterableIterator<FormattedExecutionResult>;
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
   * A pre-built subscription client satisfying the {@link SubscriptionClient}
   * contract — a single `iterate(request)` method. `graphql-ws`'s and
   * `graphql-sse`'s `createClient()` both satisfy it directly, as does any
   * custom client exposing the same method.
   *
   * Construct the client yourself and pass it in; the toolkit does not build
   * one for you. If a subscription is sent without this option configured,
   * `send()` throws. See `create-transport/README.md` for recipes.
   */
  subscriptionClient?: SubscriptionClient;
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
   * GraphQL over HTTP spec; when set to `'QUERY'`, queries are sent in a
   * request body like POST. Mutations always use POST regardless, since
   * `'GET'` and `'QUERY'` are safe methods.
   */
  method?: HttpMethod;
  /**
   * HTTP methods this transport should advertise as supported.
   * Defaults to `['POST']`. Pass e.g. `['GET', 'POST']` or
   * `['GET', 'POST', 'QUERY']` to allow switching.
   */
  supportedMethods?: HttpMethod[];
};
