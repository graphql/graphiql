---
'@graphiql/toolkit': minor
'@graphiql/react': minor
'graphiql': minor
---

Add a structured `Transport` API alongside the existing `Fetcher`. `createTransport({...})` performs the GraphQL request and returns a `TransportResponse` carrying the real HTTP wire metadata (status, headers, timing, size) for queries, mutations, subscriptions, and incremental delivery, so the response pane can surface those values directly instead of fabricating them. `<GraphiQL>` accepts a new `transport` prop, mutually exclusive with `fetcher` at the type level.

Transports support GET, POST, and the [HTTP `QUERY`](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/) method per the GraphQL over HTTP spec. Pass `method` / `supportedMethods` to choose; GET encodes the query into the URL with no body, `QUERY` sends a JSON body but is safe and idempotent, and mutations are always sent over POST (or blocked when POST is unavailable). `Transport` exposes `url`, `method`, `supportedMethods`, and an optional `setMethod`, and the top bar shows the active method and endpoint with an inline switcher that cycles through the supported methods. Subscriptions require an explicit `subscriptionClient` satisfying a small `SubscriptionClient` contract: a single `.subscribe(request, sink)` method that `graphql-ws` and `graphql-sse` clients meet directly. The low-level `simpleHttpTransport` and `multipartHttpTransport` primitives also accept an optional `method`.

Plugins can observe and transform traffic through `transport.onBeforeSend` and `transport.onResponse`, available via `useGraphiQLPluginContext()` (both return a cleanup function; the `transport` field is `undefined` under the legacy `fetcher` path, so guard with optional chaining).

`createGraphiQLFetcher`, the `Fetcher` type and its companions, and `<GraphiQL fetcher={...}>` are deprecated but continue to work unchanged. Consumers on the deprecated path see a one-time dismissible banner in the response pane pointing at `docs/migration/graphiql-6.0.0.md` rather than fabricated status/timing/size values. The CDN bundle exposes `GraphiQL.createTransport` and `GraphiQL.createWsClient` so script-tag consumers can adopt without a bundler.
