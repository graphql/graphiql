---
'@graphiql/toolkit': minor
---

Deprecate `createGraphiQLFetcher`, `Fetcher`, `FetcherParams`, `FetcherOpts`, and `CreateFetcherOptions`. They continue to work unchanged; new code should use `createTransport` and `Transport`. See `docs/migration/graphiql-6.0.0.md`.
