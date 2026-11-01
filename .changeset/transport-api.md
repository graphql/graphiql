---
'@graphiql/toolkit': minor
'@graphiql/react': minor
'graphiql': minor
---

Add `createTransport` and a structured `Transport` API for queries, mutations, subscriptions, and incremental delivery. Pass a transport through `<GraphiQL transport={...}>`; the `transport` and `fetcher` props are mutually exclusive at the type level.

When `supportedMethods` is omitted, `createTransport` discovers endpoint capabilities through `OPTIONS` and the `Allow` header. Queries prefer QUERY, then POST, then GET. Mutations and operations of unknown type require POST. An explicit `method` override applies to queries and fails if the endpoint excludes it. GET sends GraphQL parameters in the URL; POST and QUERY send a JSON body.

Discovery is shared by concurrent requests and repeats when effective request headers change. If discovery fails, exceeds two seconds, or returns no usable `Allow` header, the transport falls back to POST (or the configured override). An explicit advertisement containing no usable methods blocks execution. Pass `supportedMethods` to skip discovery for known capabilities. Cross-origin servers must permit OPTIONS and expose `Allow` through `Access-Control-Expose-Headers`.

`TransportResponse` exposes HTTP method, status, headers, timing, and byte sizes alongside the GraphQL result. HTTP metadata remains available when a response body is not valid JSON. Its `ok` field accounts for both HTTP status and GraphQL errors. `TransportRequest` supports GraphQL `extensions` and an abort `signal`. Subscriptions require an explicit `subscriptionClient` with an `iterate(request)` method, supported by `graphql-ws` v6 and `graphql-sse` clients.

Plugins can transform outgoing requests with `onBeforeSend` and observe responses or request failures with `onResponse` and `onError`, available through `useGraphiQLPluginContext().transport`. Each registration returns a cleanup function. This context field is absent when using the legacy `fetcher` prop.

Transports can expose query method preferences through optional `setMethod`, `methodOverride`, and `subscribe(listener)` APIs. Calling `setMethod()` without an argument restores automatic selection. `createTransport` implements these APIs; custom transports can omit them. The subscription reports method preference and capability changes, independently of request lifecycle hooks.

`createGraphiQLFetcher`, `Fetcher`, and `<GraphiQL fetcher={...}>` are deprecated but remain supported. See `docs/migration/graphiql-6.0.0.md` for migration examples and custom transport requirements.
