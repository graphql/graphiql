---
'@graphiql/toolkit': minor
---

Add a `Transport` primitive and `createTransport` helper. The HTTP request path now flows through a metadata-capturing transport that reads status, headers, timing and size off the real response, and `createGraphiQLFetcher` becomes a body-only projection of it. This is purely additive: the existing `Fetcher` contract and behavior are unchanged. `wsClient`/`legacyClient` are accepted so a `graphql-sse` client can drive subscriptions.
