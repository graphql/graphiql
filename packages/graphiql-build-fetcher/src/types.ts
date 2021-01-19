import type { Client } from "graphql-ws"

/**
 * Options for creating a sinple, spec-compliant GraphiQL fetcher
 */
export interface BuildFetcherOptions {
  /**
   * url for HTTP(S) requests. required!
   */
  url: string;
  /**
   * url for websocket subscription requests
   */
  subscriptionsUrl?: string;
  /**
   * wsClient implementation that matches `ws-graphql` signature,
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
   * You can disable the usage of the `fetch-multipart-graphql` library
   * entirely, defaulting to a simple fetch POST implementation.
   */
  enableMultipart?: boolean;
  /**
   * The fetch implementation, in case the user needs to override this for SSR
   * or other purposes. this does not override the `fetch-multipart-graphql`
   * default fetch behavior yet.
   */
  fetch?: typeof fetch;
}
