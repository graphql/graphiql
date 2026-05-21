import type { ExecutionResult } from 'graphql';

export type TransportRequest = {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
  query: string;
  operationName?: string | null;
  variables?: Record<string, unknown>;
  signal?: AbortSignal;
};

export type ResolverTrace = {
  path: (string | number)[];
  parentType: string;
  fieldName: string;
  returnType: string;
  startOffsetMs: number;
  durationMs: number;
};

export type TransportResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: ExecutionResult;
  timing: { totalMs: number; resolverTraces?: ResolverTrace[] };
  size: { request: number; response: number };
};

/**
 * Wire-level transport abstraction. `send()` returns a single Promise for
 * queries and mutations, or an AsyncIterable for subscriptions.
 */
export type Transport = {
  send(
    request: TransportRequest,
  ): Promise<TransportResponse> | AsyncIterable<TransportResponse>;
};

export type CreateTransportOptions = {
  /**
   * URL for HTTP(S) requests.
   */
  url: string;
  /**
   * Default HTTP method. Defaults to POST.
   */
  method?: 'GET' | 'POST';
  /**
   * Static request headers merged with per-request headers.
   */
  headers?: Record<string, string>;
  /**
   * URL for WebSocket subscription requests.
   */
  subscriptionUrl?: string;
  /**
   * Custom fetch implementation. Defaults to the global fetch.
   */
  fetch?: typeof fetch;
};
