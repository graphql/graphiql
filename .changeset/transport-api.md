---
'@graphiql/toolkit': minor
'@graphiql/react': minor
'graphiql': minor
---

Add a `Transport` API alongside the existing `Fetcher`. `createTransport({...})` performs the GraphQL request and returns a `TransportResponse` carrying the real HTTP wire metadata (status, headers, timing, size) for queries, mutations, subscriptions, and incremental delivery. `<GraphiQL>` accepts a new `transport` prop, mutually exclusive with `fetcher` at the type level, that lets the response pane surface those values directly from the underlying `Response`. Subscriptions require an explicit `subscriptionClient` satisfying a small `SubscriptionClient` contract — a single `.subscribe(request, sink)` method that `graphql-ws` and `graphql-sse` clients meet directly, and that a custom HTTP `multipart/mixed` client can implement just as easily; the toolkit no longer constructs one. The CDN bundle exposes `GraphiQL.createTransport` and `GraphiQL.createWsClient` so script-tag consumers can adopt without a bundler.

`createGraphiQLFetcher`, the `Fetcher` type and its companions, and the `<GraphiQL fetcher={...}>` prop are deprecated but continue to work unchanged. Existing code keeps compiling. Consumers on the deprecated path see a one-time dismissible banner in the response pane pointing at `docs/migration/graphiql-6.0.0.md` rather than fabricated status/timing/size values.
