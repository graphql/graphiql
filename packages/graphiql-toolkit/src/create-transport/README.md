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

## Subscriptions

`createTransport` does **not** build a subscription client for you, and it is
not tied to WebSockets. You pass a `subscriptionClient` that satisfies one small
contract, and the transport routes every subscription operation through it:

```ts
type SubscriptionClient = {
  subscribe(
    request: { query: string; operationName?: string | null; variables?: Record<string, unknown> },
    sink: {
      next: (value: ExecutionResult) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): () => void; // returns a dispose function
};
```

That is the whole surface. `subscribe` receives the operation and a `sink`,
pushes each event into `sink.next`, calls `sink.complete()` when the stream ends
(or `sink.error(err)` on failure), and returns a function that tears the
subscription down. GraphiQL calls that dispose function when the user stops the
subscription or the tab closes.

`graphql-ws` and `graphql-sse` both return a client that satisfies this contract
directly, so either drops in with no wrapping. Any protocol you can express as
`subscribe(request, sink)` — including plain HTTP `multipart/mixed` — works the
same way, with no changes to the toolkit.

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

`graphql-sse`'s `createClient()` is signature-compatible, so the same option
drives SSE with no SSE-specific code:

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

### HTTP `multipart/mixed` subscriptions

Some servers deliver subscriptions over the same HTTP endpoint as queries and
mutations, as a `multipart/mixed` stream of `{ payload }` envelopes with `{}`
heartbeats — there is no WebSocket endpoint at all. Because `subscriptionClient`
is just `subscribe(request, sink)`, you can implement that protocol as a small
client and pass it in. `meros` (already a toolkit dependency) parses the stream:

```ts
import { meros } from 'meros/browser';
import { isAsyncIterable } from '@n1ru4l/push-pull-async-iterable-iterator';
import { createTransport, type SubscriptionClient } from '@graphiql/toolkit';

const url = 'https://my.endpoint/graphql';

const multipartSubscriptionClient: SubscriptionClient = {
  subscribe(request, sink) {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            accept: 'multipart/mixed;subscriptionSpec="1.0", application/json',
          },
          body: JSON.stringify(request),
        });

        const parts = await meros<{
          payload?: { data?: unknown; errors?: unknown; extensions?: unknown } | null;
          errors?: unknown;
        }>(response);

        // Server answered with a single JSON body (e.g. a request error).
        if (!isAsyncIterable(parts)) {
          sink.next(await response.json());
          sink.complete();
          return;
        }

        for await (const part of parts) {
          if (!part.json) {
            continue;
          }
          const frame = part.body;

          // Heartbeat: `{}` — no `payload` key. Skip it.
          if (!('payload' in frame)) {
            continue;
          }
          // Fatal error frame: `{ payload: null, errors: [...] }`. Terminate.
          if (frame.payload === null) {
            if (frame.errors) {
              sink.next({ errors: frame.errors as any });
            }
            break;
          }
          // Normal frame: `{ payload: { data, errors, extensions } }`.
          sink.next(frame.payload as any);
        }
        sink.complete();
      } catch (error) {
        if (!controller.signal.aborted) {
          sink.error(error);
        }
      }
    })();

    return () => controller.abort();
  },
};

const transport = createTransport({
  url,
  subscriptionClient: multipartSubscriptionClient,
});
```

Queries and mutations still take the transport's normal HTTP path; only
subscription operations are routed to the client above.

## Migrating from `createGraphiQLFetcher`

`createGraphiQLFetcher` hardwired subscriptions to WebSockets via
`subscriptionUrl`/`wsClient`/`legacyClient`. `createTransport` replaces those
with the single `subscriptionClient` option. See the
[GraphiQL 6 migration guide](../../../../docs/migration/graphiql-6.0.0.md) for
the full upgrade path.
