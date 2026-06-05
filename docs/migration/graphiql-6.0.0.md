# Upgrading `graphiql` to `6.0.0`

This covers the one notable change in `graphiql@6`: a new `Transport` API that replaces `Fetcher`/`createGraphiQLFetcher`. The rest of the surface carries over. Open an issue if something is missing here and we'll add it.

## Overview

`@graphiql/toolkit` adds `createTransport`, which takes the same options as `createGraphiQLFetcher` and produces a `Transport`. Unlike `Fetcher`, a `Transport`'s response carries the real HTTP wire data: status code, headers, body, timing, and request/response sizes. `<GraphiQL>` accepts a new `transport` prop alongside the existing `fetcher` prop; the two are mutually exclusive at the type level. The old API still works.

## `createGraphiQLFetcher` → `createTransport`

The HTTP options object carries over. Subscriptions are different: `createTransport` does not build a subscription client for you. You construct your own `graphql-ws` (or `graphql-sse`) client and pass it as `subscriptionClient`. There is no `subscriptionUrl`, `wsClient`, `legacyClient`, or `wsConnectionParams` option.

**Before:**

```ts
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const fetcher = createGraphiQLFetcher({
  url: 'https://my.endpoint/graphql',
  subscriptionUrl: 'wss://my.endpoint/graphql',
});
```

**After (WebSocket subscriptions):**

```ts
import { createClient } from 'graphql-ws';
import { createTransport } from '@graphiql/toolkit';

const transport = createTransport({
  url: 'https://my.endpoint/graphql',
  subscriptionClient: createClient({ url: 'wss://my.endpoint/graphql' }),
});
```

**After (SSE subscriptions):**

`graphql-sse`'s `createClient()` is signature-compatible with `graphql-ws`, so the same option drives either protocol:

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

If you only run queries and mutations, leave `subscriptionClient` off. A subscription dispatched without it throws with a pointer back to this page.

## `<GraphiQL fetcher={...}>` → `<GraphiQL transport={...}>`

**Before:**

```tsx
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';

const fetcher = createGraphiQLFetcher({ url: 'https://my.endpoint/graphql' });

function App() {
  return <GraphiQL fetcher={fetcher} />;
}
```

**After:**

```tsx
import { createTransport } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';

const transport = createTransport({ url: 'https://my.endpoint/graphql' });

function App() {
  return <GraphiQL transport={transport} />;
}
```

Passing both props is a type error. Remove `fetcher` when you add `transport`.

## What you get

With a `Transport`, the response pane header shows the real HTTP status code, total round-trip time, and the request and response byte sizes, read directly off the `Response`. Response headers are accessible through the response detail panel.

With a `fetcher`, none of that is observable. The `Fetcher` contract is `(params) => ExecutionResult`, which discards the HTTP envelope before GraphiQL sees it. The response pane shows a small dismissible notice pointing here instead of fabricated values.

## Custom fetchers (FAQ)

If you hand-rolled a `Fetcher` rather than using `createGraphiQLFetcher`, migrate by implementing the `Transport` interface directly. A `Transport` is an object with a `send(request)` method. For queries and mutations it returns a `Promise<TransportResponse>`; for subscriptions and incremental delivery it returns an `AsyncIterable<TransportResponse>`, one entry per event or chunk.

**Before (custom fetcher):**

```ts
import type { Fetcher } from '@graphiql/toolkit';

const fetcher: Fetcher = async params => {
  const res = await fetch('/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
};
```

**After (custom transport):**

```ts
import type { Transport } from '@graphiql/toolkit';

const transport: Transport = {
  async send(request) {
    const startMs = performance.now();
    const requestBody = JSON.stringify({
      query: request.query,
      operationName: request.operationName,
      variables: request.variables,
    });
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...request.headers },
      body: requestBody,
    });
    const body = await response.json();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      ok: !body.errors?.length,
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      timing: { totalMs: performance.now() - startMs },
      size: {
        request: new TextEncoder().encode(requestBody).length,
        response: new TextEncoder().encode(JSON.stringify(body)).length,
      },
    };
  },
};
```

Read `status`, `statusText`, and `headers` off the real `Response`. Don't hard-code them; the response pane reads those fields directly.

## What's deprecated, not removed

The following are deprecated in `graphiql@6`. They continue to work and might be removed in a future major version.

| Deprecated                                       | Replacement       |
| ------------------------------------------------ | ----------------- |
| `createGraphiQLFetcher` from `@graphiql/toolkit` | `createTransport` |
| `fetcher` prop on `<GraphiQL>`                   | `transport` prop  |
| `Fetcher` type from `@graphiql/toolkit`          | `Transport`       |

Existing code keeps compiling and running today. Migrate when you want the response pane to show real wire data, or before a future major version drops the deprecated path.
