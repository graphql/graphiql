# @graphiql/toolkit

## 0.2.2

### Patch Changes

- [`5b8a057d`](https://github.com/graphql/graphiql/commit/5b8a057dd64ebecc391be32176a2403bb9d9ff92) [#1838](https://github.com/graphql/graphiql/pull/1838) Thanks [@acao](https://github.com/acao)! - Set all cross-runtime build targets to es6

## 0.2.1

### Patch Changes

- [`3f002710`](https://github.com/graphql/graphiql/commit/3f00271089cbc519e221976c9308f60b317cae80) [#1840](https://github.com/graphql/graphiql/pull/1840) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Use provided `wsConnectionParams`

* [`94f16957`](https://github.com/graphql/graphiql/commit/94f169572f643374ead829af690b6dcc2eb0b6a1) [#1841](https://github.com/graphql/graphiql/pull/1841) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Subscriptions async iterator completes and better error handling

## 0.2.0

### Minor Changes

- [`dd9397e4`](https://github.com/graphql/graphiql/commit/dd9397e4c693b5ceadbd26d6fa92aa6246aac9c3) [#1819](https://github.com/graphql/graphiql/pull/1819) Thanks [@acao](https://github.com/acao)! - `GraphiQL.createClient()` accepts custom `legacyClient`, exports typescript types, fixes #1800.

  `createGraphiQLFetcher` now only attempts an `graphql-ws` connection when only `subscriptionUrl` is provided. In order to use `graphql-transport-ws`, you'll need to provide the `legacyClient` option only, and no `subscriptionUrl` or `wsClient` option.

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

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
