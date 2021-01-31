import type { Client, ClientOptions } from 'graphql-ws';
import type { SubscriptionClient } from 'subscriptions-transport-ws';
import type { Fetcher } from '@graphiql/toolkit';

export type WebsocketsClient = Client | SubscriptionClient;

/**
 * Options for creating a sinple, spec-compliant GraphiQL fetcher
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
   * Headers you can provide statically.
   *
   * If you enable the headers editor and the user provides
   * A header you set statically here, it will be overriden by their value.
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
