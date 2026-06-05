---
'@graphiql/toolkit': minor
'@graphiql/react': minor
'graphiql': minor
---

Add a `Transport` API alongside the existing `Fetcher`. `createTransport({...})` performs the GraphQL request and returns a `TransportResponse` carrying the real HTTP wire metadata (status, headers, timing, size) for queries, mutations, subscriptions, and incremental delivery. `<GraphiQL>` accepts a new `transport` prop, mutually exclusive with `fetcher` at the type level, that lets the response pane surface those values directly from the underlying `Response`. Subscriptions require an explicit `subscriptionClient` (any client whose `.subscribe(payload, sink)` matches the `graphql-ws` `Client` shape, including `graphql-sse`'s `createClient()`); the toolkit no longer constructs one. The CDN bundle exposes `GraphiQL.createTransport` and `GraphiQL.createWsClient` so script-tag consumers can adopt without a bundler.

`createGraphiQLFetcher`, the `Fetcher` type and its companions, and the `<GraphiQL fetcher={...}>` prop are deprecated but continue to work unchanged. Existing code keeps compiling. Consumers on the deprecated path see a one-time dismissible banner in the response pane pointing at `docs/migration/graphiql-6.0.0.md` rather than fabricated status/timing/size values.
