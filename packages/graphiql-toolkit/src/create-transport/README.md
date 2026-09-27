# `createTransport`

`createTransport` builds a `Transport`: the wire-level primitive `<GraphiQL>`
uses to run operations. Unlike a `Fetcher`, a `Transport` response carries the
real HTTP metadata — status, headers, timing, and request/response sizes.

```ts
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({ url: 'https://my.endpoint/graphql' });

// <GraphiQL transport={transport} />
```

Queries and mutations work with nothing but a `url`. `@defer`/`@stream`
incremental delivery over `multipart/mixed` is on by default (disable it with
`enableIncrementalDelivery: false`). GET is opt-in via `method`/
`supportedMethods`.

`send()` takes a `TransportRequest`: `query`, `operationName`, `variables`,
`extensions` (GraphQL-over-HTTP extensions, e.g. for automatic persisted
queries — JSON-stringified into the URL for `GET`, sent in the JSON body for
`POST` and `QUERY`), per-request `headers`, and `signal` to cancel the request
with an `AbortController`:

```ts
const controller = new AbortController();

const response = transport.send({
  query: 'query Hello { hello }',
  signal: controller.signal,
});

// Cancel the in-flight request.
controller.abort();
```

For a subscription, prefer stopping the returned `AsyncIterable` (call
`.return()` on its iterator) over `signal` — an aborted signal only cancels
the initial HTTP request, not an open socket.

## Subscriptions

`createTransport` does **not** build a subscription client for you, and it is
not tied to WebSockets. You pass a `subscriptionClient` that satisfies one small
contract, and the transport routes every subscription operation through it:

```ts
type SubscriptionClient = {
  iterate(request: {
    query: string;
    operationName?: string | null;
    variables?: Record<string, unknown>;
    extensions?: Record<string, unknown>;
  }): AsyncIterableIterator<FormattedExecutionResult>;
};
```

That is the whole surface. GraphiQL calls `iterate` when it starts reading the
subscription, then forwards `.return()` to the returned iterator when the user
stops the subscription or the tab closes. A custom iterator's `.return()` must
promptly stop its underlying work and settle any pending `.next()` call.

`graphql-ws` v6 and `graphql-sse` both return a client that satisfies this
contract directly, so either drops in with no wrapping. Any protocol can be
used by exposing the same async-iterator contract.

If a subscription is sent and no `subscriptionClient` is configured, `send()`
throws. Leave the option off if you only run queries and mutations.

### WebSockets — `graphql-ws`

```ts
import { createClient } from 'graphql-ws';
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  subscriptionClient: createClient({ url: 'wss://my.endpoint/graphql' }),
});
```

### Server-Sent Events — `graphql-sse`

`graphql-sse`'s `createClient()` exposes the same `iterate()` method, so the
same option drives SSE with no SSE-specific code:

```ts
import { createClient } from 'graphql-sse';
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  subscriptionClient: createClient({
    url: 'https://my.endpoint/graphql/stream',
  }),
});
```

### Custom subscription client

If a protocol library exposes an abortable `AsyncIterable`, adapt it by
forwarding iteration and aborting its work from `.return()`. The abort signal
must cause a pending source `.next()` call to settle. In this example,
`myProtocol.subscribe()` represents that abortable stream API:

```ts
import { createTransport, type SubscriptionClient } from '@graphiql/toolkit';

const subscriptionClient: SubscriptionClient = {
  iterate(request) {
    const controller = new AbortController();
    const source = myProtocol
      .subscribe(request, { signal: controller.signal })
      [Symbol.asyncIterator]();
    let closed = false;

    return {
      next() {
        return closed
          ? Promise.resolve({ done: true, value: undefined })
          : source.next();
      },
      async return() {
        if (!closed) {
          closed = true;
          controller.abort();
          await source.return?.();
        }
        return { done: true, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  },
};

const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  subscriptionClient,
});
```

## Migrating from `createGraphiQLFetcher`

`createGraphiQLFetcher` hardwired subscriptions to WebSockets via
`subscriptionUrl`/`wsClient`/`legacyWsClient`. `createTransport` replaces those
with the single `subscriptionClient` option. See the
[GraphiQL 6 migration guide](../../../../docs/migration/graphiql-6.0.0.md) for
the full upgrade path.
