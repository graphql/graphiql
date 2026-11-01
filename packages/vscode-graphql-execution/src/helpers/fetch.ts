import nodeFetch from 'node-fetch';
import type { ClientOptions } from '@urql/core';

type Fetch = NonNullable<ClientOptions['fetch']>;

export function getFetch(): Fetch {
  // urql sends URL strings and supports node-fetch's Node.js response streams.
  return globalThis.fetch ?? (nodeFetch as unknown as Fetch);
}
