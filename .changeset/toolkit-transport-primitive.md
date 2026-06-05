---
'@graphiql/toolkit': minor
---

Add a `Transport` API alongside the existing `Fetcher`. `createTransport({...})` performs the request and returns structured response data (status, headers, timing, size) for queries, mutations, subscriptions and incremental delivery. `createGraphiQLFetcher` and the `Fetcher` type are unchanged and continue to work. Subscriptions require an explicit `subscriptionClient` (any client whose `.subscribe(payload, sink)` matches the `graphql-ws` shape, including `graphql-sse`'s `createClient()`); the toolkit no longer constructs one for you.
