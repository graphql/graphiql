import type { ExecutionResult } from 'graphql';

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
 * The event stream a {@link SubscriptionClient} pushes results into.
 * Deliberately the minimal subset of `graphql-ws`'s `Sink` the transport
 * relies on, so a `graphql-ws` (or signature-compatible `graphql-sse`) client
 * satisfies it structurally, with no adapter.
 */
export type SubscriptionSink = {
  /** Deliver one subscription event. */
  next: (value: ExecutionResult) => void;
  /** Report a terminal error; closes the stream. */
  error: (error: unknown) => void;
  /** Signal the stream has ended; closes the stream. */
  complete: () => void;
};

/**
 * The GraphQL request handed to {@link SubscriptionClient.subscribe}. Carries
 * only the operation itself — transport concerns such as per-request headers
 * are not part of the subscription contract.
 */
export type SubscriptionRequest = {
  query: string;
  operationName?: string | null;
  variables?: Record<string, unknown>;
};

/**
 * The narrowest subscription-client contract the transport depends on: a single
 * `subscribe(request, sink)` that streams events into `sink` and returns a
 * dispose function used to tear the subscription down.
 *
 * This is intentionally the smallest shape that both `graphql-ws`'s and
 * `graphql-sse`'s `createClient()` already satisfy, so either drops in with no
 * wrapping — and so does any custom client (for example one that reads HTTP
 * `multipart/mixed`) able to expose the same method. See the recipes in
 * `create-transport/README.md`.
 */
export type SubscriptionClient = {
  subscribe(request: SubscriptionRequest, sink: SubscriptionSink): () => void;
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
   * contract — a single `subscribe(request, sink)` method. `graphql-ws`'s and
   * `graphql-sse`'s `createClient()` both satisfy it directly, as does any
   * custom client (e.g. HTTP `multipart/mixed`) exposing the same method.
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
