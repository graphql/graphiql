# @graphiql/toolkit

## 0.1.1

### Patch Changes

- [`d3278556`](https://github.com/graphql/graphiql/commit/d3278556d050d948930c4b35a73039255f9a92b7) Thanks [@harshithpabbati](https://github.com/harshithpabbati)! - Move `@graphiql/create-fetcher` to `@graphiql/toolkit` because it doesn't need to be it's own package as @imolorhe pointed out

## 0.1.0

### Minor Changes

- 1c119386: `@defer`, `@stream`, and `graphql-ws` support in a `createGraphiQLFetcher` utility (#1770)

  - support for `@defer` and `@stream` in `GraphiQL` itself on fetcher execution and when handling stream payloads
  - introduce `@graphiql/toolkit` for types and utilities used to compose `GraphiQL` and other related libraries
  - introduce `@graphiql/create-fetcher` to accept simplified parameters to generate a `fetcher` that covers the most commonly used `graphql-over-http` transport spec proposals. using `meros` for multipart http, and `graphql-ws` for websockets subscriptions.
  - use `graphql` and `graphql-express` `experimental-defer-stream` branch in development until it's merged
  - add cypress e2e tests for `@stream` in different scenarios
  - add some unit tests for `createGraphiQLFetcher`
