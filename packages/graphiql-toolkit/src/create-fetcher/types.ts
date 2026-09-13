import type { DocumentNode, IntrospectionQuery } from 'graphql';
import type { Client, ClientOptions, ExecutionResult } from 'graphql-ws';

export type Observable<T> = {
  subscribe(opts: {
    next: (value: T) => void;
    error: (error: any) => void;
    complete: () => void;
  }): Unsubscribable;
  subscribe(
    next: (value: T) => void,
    error: null | undefined,
    complete: () => void,
  ): Unsubscribable;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): Unsubscribable;
};

// This type just taken from https://github.com/ReactiveX/rxjs/blob/master/src/internal/types.ts#L41
export type Unsubscribable = {
  unsubscribe: () => void;
};

/**
 * @deprecated Use the `Transport` API and `TransportRequest` from `@graphiql/toolkit`
 * instead. See `docs/migration/graphiql-6.0.0.md`.
 */
export type FetcherParams = {
  query: string;
  operationName?: string | null;
  variables?: any;
  extensions?: Record<string, unknown>;
};

/**
 * @deprecated Use the `Transport` API from `@graphiql/toolkit` instead.
 * See `docs/migration/graphiql-6.0.0.md`.
 */
export type FetcherOpts = {
  headers?: { [key: string]: any };
  documentAST?: DocumentNode;
  /**
   * Aborts the underlying `fetch` call when triggered. Only consulted by the
   * `Transport`-facing primitives (`simpleHttpTransport`,
   * `multipartHttpTransport`); the deprecated `Fetcher` functions ignore it.
   */
  signal?: AbortSignal;
};

export type ExecutionResultPayload =
  | {
      data: IntrospectionQuery;
      errors?: Array<any>;
    }
  // normal result payloads
  | { data?: any; errors?: Array<any> }
  // for the initial Stream/Defer payload
  | { data?: any; errors?: Array<any>; hasNext: boolean }
  // for successive Stream/Defer payloads
  | {
      data?: any;
      errors?: any[];
      path: (string | number)[];
      hasNext: boolean;
    };

export type FetcherResultPayload = ExecutionResultPayload;

export type MaybePromise<T> = T | Promise<T>;

export type FetcherResult = ExecutionResult | { data: IntrospectionQuery };

export type SyncExecutionResult =
  | ExecutionResult
  | Observable<ExecutionResult>
  | AsyncIterable<ExecutionResult>;

export type SyncFetcherResult = SyncExecutionResult;

export type FetcherReturnType = MaybePromise<SyncExecutionResult>;

/**
 * @deprecated Use `Transport` from `@graphiql/toolkit` instead. A `Transport` is
 * an object with a `send(request)` method that returns a `TransportResponse`
 * carrying the real HTTP wire data (status, headers, timing, size).
 * See `docs/migration/graphiql-6.0.0.md`.
 */
export type Fetcher = (
  graphQLParams: FetcherParams,
  opts?: FetcherOpts,
) => FetcherReturnType;

/**
 * Options for creating a simple, spec-compliant GraphiQL fetcher
 *
 * @deprecated Use `CreateTransportOptions` from `@graphiql/toolkit` instead.
 * See `docs/migration/graphiql-6.0.0.md`.
 */
export interface CreateFetcherOptions {
  /**
   * url for HTTP(S) requests. required!
   */
  url: string;
  /**
   * url for websocket subscription requests
   */
  subscriptionUrl?: string;
  /**
   * `wsClient` implementation that matches `ws-graphql` signature,
   * whether via `createClient()` itself or another client.
   */
  wsClient?: Client;
  /**
   * `legacyWsClient` implementation that matches `subscriptions-transport-ws` signature,
   * whether via `new SubscriptionsClient()` itself or another client with a similar signature.
   */
  legacyWsClient?: any;
  /**
   * Request headers you can provide statically.
   *
   * If you enable the request headers editor and the user provides
   * A header you set statically here, it will be overridden by their value.
   */
  headers?: Record<string, string>;
  /**
   * Websockets connection params used when you provide subscriptionUrl. graphql-ws `ClientOptions.connectionParams`
   */
  wsConnectionParams?: ClientOptions['connectionParams'];
  /**
   * You can disable the usage of the `fetch-multipart-graphql` library
   * entirely, defaulting to a simple fetch POST implementation.
   */
  enableIncrementalDelivery?: boolean;
  /**
   * The fetch implementation, in case the user needs to override this for SSR
   * or other purposes. this does not override the `fetch-multipart-graphql`
   * default fetch behavior yet.
   */
  fetch?: typeof fetch;
  /**
   * An optional custom fetcher specifically for your schema. For most cases
   * the `url` and `headers` property should have you covered.
   */
  schemaFetcher?: Fetcher;
}
