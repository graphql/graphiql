# @graphiql/toolkit

## 0.9.1

### Patch Changes

- [#3298](https://github.com/graphql/graphiql/pull/3298) [`4cbdf183`](https://github.com/graphql/graphiql/commit/4cbdf18385d34ef9bc095c376936f92a62eb9e9b) Thanks [@esquevin](https://github.com/esquevin)! - Prevent OOM on merging complex queries

## 0.9.0

### Minor Changes

- [#3022](https://github.com/graphql/graphiql/pull/3022) [`ffb6486d`](https://github.com/graphql/graphiql/commit/ffb6486d1eab0be2bc8fdec366b5671a5d6504d1) Thanks [@heyacherry](https://github.com/heyacherry)! - Add a new utility function `createLocalStorage` that creates a local storage with support for custom namespaces

## 0.8.4

### Patch Changes

- [#3113](https://github.com/graphql/graphiql/pull/3113) [`2e477eb2`](https://github.com/graphql/graphiql/commit/2e477eb24672a242ae4a4f2dfaeaf41152ed7ee9) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `.forEach` with `for..of`

- [#3109](https://github.com/graphql/graphiql/pull/3109) [`51007002`](https://github.com/graphql/graphiql/commit/510070028b7d8e98f2ba25f396519976aea5fa4b) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-floating-promises` eslint rule

- [#3120](https://github.com/graphql/graphiql/pull/3120) [`15c26eb6`](https://github.com/graphql/graphiql/commit/15c26eb6d621a85df9eecb2b8a5fa009fa2fe040) Thanks [@B2o5T](https://github.com/B2o5T)! - prefer await to then

## 0.8.3

### Patch Changes

- [#3046](https://github.com/graphql/graphiql/pull/3046) [`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer .at() method for index access

- [#3042](https://github.com/graphql/graphiql/pull/3042) [`881a2024`](https://github.com/graphql/graphiql/commit/881a202497d5a58eb5260a5aa54c0c88930d69a0) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer String#slice() over String#substr() and String#substring()

## 0.8.2

### Patch Changes

- [#2962](https://github.com/graphql/graphiql/pull/2962) [`db2a0982`](https://github.com/graphql/graphiql/commit/db2a0982a17134f0069483ab283594eb64735b7d) Thanks [@B2o5T](https://github.com/B2o5T)! - clean all ESLint warnings, add `--max-warnings=0` and `--cache` flags

## 0.8.1

### Patch Changes

- [#2931](https://github.com/graphql/graphiql/pull/2931) [`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-negated-condition` and `no-else-return` rules

- [#2923](https://github.com/graphql/graphiql/pull/2923) [`695100bd`](https://github.com/graphql/graphiql/commit/695100bd317940ff3ffd8f56b54248c1dba1ac04) Thanks [@TheMightyPenguin](https://github.com/TheMightyPenguin)! - Remove side-effect in StorageAPI that overrides localStorage.clear

- [#2937](https://github.com/graphql/graphiql/pull/2937) [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-includes`

- [#2965](https://github.com/graphql/graphiql/pull/2965) [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-optional-catch-binding` rule

- [#2936](https://github.com/graphql/graphiql/pull/2936) [`18f8e80a`](https://github.com/graphql/graphiql/commit/18f8e80ae12edfd0c36adcb300cf9e06ac27ea49) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `lonely-if`/`unicorn/lonely-if` rules

- [#2938](https://github.com/graphql/graphiql/pull/2938) [`6a9d913f`](https://github.com/graphql/graphiql/commit/6a9d913f0d1b847124286b3fa1f3a2649d315171) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/throw-new-error` rule

## 0.8.0

### Minor Changes

- [#2719](https://github.com/graphql/graphiql/pull/2719) [`e244b782`](https://github.com/graphql/graphiql/commit/e244b78291c2e2bb02d5753db82437926ebb4df4) Thanks [@andreialecu](https://github.com/andreialecu)! - Allow passing Headers for subscriptions into connection_init payload

## 0.7.3

### Patch Changes

- [#2755](https://github.com/graphql/graphiql/pull/2755) [`674bf3f8`](https://github.com/graphql/graphiql/commit/674bf3f8ff321dfb8471b0f6e5419bb77ddc94af) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Only remove namespaced items when clearing `localStorage`

## 0.7.2

### Patch Changes

- [#2753](https://github.com/graphql/graphiql/pull/2753) [`bfa90f24`](https://github.com/graphql/graphiql/commit/bfa90f249be4f68049c1bb81abfb524ae623313f) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Mark the `graphql-ws` peer dependency as optional (as it's only needed when the fetcher needs to support subscriptions)

* [#2751](https://github.com/graphql/graphiql/pull/2751) [`8ab5fcd0`](https://github.com/graphql/graphiql/commit/8ab5fcd0a8399a0f8eb1b569751dd0e8390b9679) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Correctly handle `null` in type-guard functions for `Promise` and `Observable`

## 0.7.1

### Patch Changes

- [#2737](https://github.com/graphql/graphiql/pull/2737) [`48872a87`](https://github.com/graphql/graphiql/commit/48872a87e6edec0c301102baaf669ffcce043a13) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Handle execution when there is no document AST (because the query editor is empty or the query string contains syntax errors)

## 0.7.0

### Minor Changes

- [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - BREAKING: Don't pass `shouldPersistHeaders` anymore when invoking the fetcher function. This value can be looked up by consuming the `EditorContext`:

  ```js
  import { useEditorContext } from '@graphiql/react';

  function MyComponent() {
    const { shouldPersistHeaders } = useEditorContext();
    // Do things...
  }
  ```

* [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - Add a `clear` method to `Storage` classes

## 0.6.1

### Patch Changes

- [#2535](https://github.com/graphql/graphiql/pull/2535) [`ea732ea8`](https://github.com/graphql/graphiql/commit/ea732ea8e12272c998f1467af8b3b88b6b508e12) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix error formatting for websocket requests and make error formatting more generic in general

## 0.6.0

### Minor Changes

- [#2419](https://github.com/graphql/graphiql/pull/2419) [`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the `fillLeafs` utility function from `graphiql` into `@graphiql/toolkit` and deprecate the export from `graphiql`

* [#2419](https://github.com/graphql/graphiql/pull/2419) [`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the `mergeAst` utility function from `graphiql` into `@graphiql/toolkit` and deprecate the export from `graphiql`

- [#2419](https://github.com/graphql/graphiql/pull/2419) [`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the `getSelectedOperationName` utility function from `graphiql` into `@graphiql/toolkit` and deprecate the export from `graphiql`

### Patch Changes

- [#2413](https://github.com/graphql/graphiql/pull/2413) [`8be164b1`](https://github.com/graphql/graphiql/commit/8be164b1e158d00752d6d3f30630a797d07d08c9) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Allow creating noop StorageAPI instances by passing `null` to the constructor

## 0.5.0

### Minor Changes

- [#2412](https://github.com/graphql/graphiql/pull/2412) [`c2e2f53d`](https://github.com/graphql/graphiql/commit/c2e2f53d3b2ae369feb68537f92c73bcfd962f29) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move QueryStore from `graphiql` package to `@graphiql/toolkit`

* [#2412](https://github.com/graphql/graphiql/pull/2412) [`c2e2f53d`](https://github.com/graphql/graphiql/commit/c2e2f53d3b2ae369feb68537f92c73bcfd962f29) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move HistoryStore from `graphiql` package to `@graphiql/toolkit`

- [#2412](https://github.com/graphql/graphiql/pull/2412) [`c2e2f53d`](https://github.com/graphql/graphiql/commit/c2e2f53d3b2ae369feb68537f92c73bcfd962f29) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move StorageAPI from `graphiql` package to `@graphiql/toolkit`

### Patch Changes

- [#2407](https://github.com/graphql/graphiql/pull/2407) [`bc3dc64c`](https://github.com/graphql/graphiql/commit/bc3dc64c37478ba6170c49c25fb755b4f2e020b2) Thanks [@benjdlambert](https://github.com/benjdlambert)! - Move `graphql-ws` dependency to a dynamic import, and add a nice error message when it's not installed

## 0.4.5

### Patch Changes

- [#2401](https://github.com/graphql/graphiql/pull/2401) [`60a744b1`](https://github.com/graphql/graphiql/commit/60a744b1d73d1021afb7abeea1573f26178102b5) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - move async helper functions and formatting functions over into the @graphiql/toolkit package

* [#2401](https://github.com/graphql/graphiql/pull/2401) [`60a744b1`](https://github.com/graphql/graphiql/commit/60a744b1d73d1021afb7abeea1573f26178102b5) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - deprecate the unused `shouldPersistHeaders` property from fetcher options to be removed in the next major version

## 0.4.4

### Patch Changes

- [#2373](https://github.com/graphql/graphiql/pull/2373) [`5b2c1b20`](https://github.com/graphql/graphiql/commit/5b2c1b2054a70e8dca173f380f44766438cb5597) Thanks [@benjie](https://github.com/benjie)! - Fix TypeScript definition of FetcherParams to reflect that operationName is optional

## 0.4.3

### Patch Changes

- [#2274](https://github.com/graphql/graphiql/pull/2274) [`12950380`](https://github.com/graphql/graphiql/commit/12950380e92c38f6eec23499e7fca5dc9dcd8216) Thanks [@B2o5T](https://github.com/B2o5T)! - turn `valid-typeof` as `error`, SSR fix

## 0.4.2

### Patch Changes

- [`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf) [#2045](https://github.com/graphql/graphiql/pull/2045) Thanks [@acao](https://github.com/acao)! - fix graphql-js peer dependencies - [#2044](https://github.com/graphql/graphiql/pull/2044)

## 0.4.1

### Patch Changes

- [`dec207e7`](https://github.com/graphql/graphiql/commit/dec207e74f0506db069482cc30f8cd1f045d8107) [#2017](https://github.com/graphql/graphiql/pull/2017) Thanks [@acao](https://github.com/acao)! - graphql-ws is now a peerDependency. It supports ~4.5.0 to the latest graphql-ws@5.5.5 and beyond. we suggest using the latest version!

## 0.4.0

### Minor Changes

- [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a) [#2010](https://github.com/graphql/graphiql/pull/2010) Thanks [@acao](https://github.com/acao)! - upgrade to `graphql@16.0.0-experimental-stream-defer.5`. thanks @saihaj!

## 0.3.2

### Patch Changes

- [`86795d5f`](https://github.com/graphql/graphiql/commit/86795d5ffa2d3e6c8aee74f761d02f054b428d46) Thanks [@acao](https://github.com/acao)! - Remove bad type definition from `subscriptions-transport-ws` #1992 closes #1989

## 0.3.1

### Patch Changes

- [`62e786b5`](https://github.com/graphql/graphiql/commit/62e786b57cc5748eccac59814dfc8ecd0104c748) [#1990](https://github.com/graphql/graphiql/pull/1990) Thanks [@acao](https://github.com/acao)! - Remove type definition from `subscriptions-transport-ws`

## 0.3.0

### Minor Changes

- [`6a459f4c`](https://github.com/graphql/graphiql/commit/6a459f4c235bb0d70725ae6ad7fc1cfa34f49dca) [#1968](https://github.com/graphql/graphiql/pull/1968) Thanks [@acao](https://github.com/acao)! - Remove `optionalDependencies` entirely, remove `subscriptions-transport-ws` which introduces vulnerabilities, upgrade `@n1ru4l/push-pull-async-iterable-iterator` to 3.0.0, upgrade `graphql-ws` several minor versions - the `graphql-ws@5.x` upgrade will come in a later minor release.

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
