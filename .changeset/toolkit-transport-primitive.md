---
'@graphiql/toolkit': minor
---

Add a `Transport` API alongside the existing `Fetcher`. `createTransport({...})` performs the request and returns structured response data (status, headers, timing, size) for queries, mutations, subscriptions and incremental delivery. `createGraphiQLFetcher` and the `Fetcher` type are unchanged and continue to work. `wsClient` and `legacyClient` are accepted by `createTransport`, so a `graphql-sse` client can drive subscriptions without any SSE-specific code in the toolkit.
