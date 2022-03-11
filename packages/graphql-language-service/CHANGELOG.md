# graphql-language-service

## 5.0.0

### Major Changes

- [#2209](https://github.com/graphql/graphiql/pull/2209) [`2502a364`](https://github.com/graphql/graphiql/commit/2502a364b74dc754d92baa1579b536cf42139958) Thanks [@acao](https://github.com/acao)! - Retire parser, interface, utils and types packages, combine with graphql-language-service

## 4.1.5

### Patch Changes

- [#2161](https://github.com/graphql/graphiql/pull/2161) [`484c0523`](https://github.com/graphql/graphiql/commit/484c0523cdd529f9e261d61a38616b6745075c7f) Thanks [@orta](https://github.com/orta)! - Do not log errors when a JS/TS file has no embedded graphql tags

* [#2176](https://github.com/graphql/graphiql/pull/2176) [`5852ba47`](https://github.com/graphql/graphiql/commit/5852ba47c720a2577817aed512bef9a262254f2c) Thanks [@orta](https://github.com/orta)! - Update babel parser in the graphql language server

- [#2175](https://github.com/graphql/graphiql/pull/2175) [`48c5df65`](https://github.com/graphql/graphiql/commit/48c5df654e323cee3b8c57d7414247465235d1b5) Thanks [@orta](https://github.com/orta)! - Better handling of unparsable babel JS/TS files

## 4.1.4

### Patch Changes

- Updated dependencies [[`d5fca9db`](https://github.com/graphql/graphiql/commit/d5fca9db067927446087717b84e0b2a3ff94bbe9)]:
  - graphql-language-service-interface@2.10.2

## 4.1.3

### Patch Changes

- [#2103](https://github.com/graphql/graphiql/pull/2103) [`a44772d6`](https://github.com/graphql/graphiql/commit/a44772d6af97254c4f159ea7237e842a3e3719e8) Thanks [@acao](https://github.com/acao)! - LangugeService should not be imported by `codemirror-graphql`, and thus `picomatch` should not be imported.

## 4.1.2

### Patch Changes

- [#2101](https://github.com/graphql/graphiql/pull/2101) [`e20760fb`](https://github.com/graphql/graphiql/commit/e20760fbd95c13d6d549cba3faa15a59aee9a2c0) Thanks [@acao](https://github.com/acao)! - Fix picomatch bug by using a browser compatible fork

## 4.1.1

### Patch Changes

- Updated dependencies [[`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63)]:
  - graphql-language-service-interface@2.10.1
  - graphql-language-service-utils@2.7.1
  - graphql-language-service-types@1.8.7
  - graphql-language-service-parser@1.10.4

## 4.1.0

### Minor Changes

- [#2086](https://github.com/graphql/graphiql/pull/2086) [`0f1f90ce`](https://github.com/graphql/graphiql/commit/0f1f90ce8f4a25ddebdaf7a9ddbe136214aa64a3) Thanks [@acao](https://github.com/acao)! - Export all modules & types explicitly from `graphql-language-service`

## 4.0.0

### Major Changes

- [#1997](https://github.com/graphql/graphiql/pull/1997) [`9df315b4`](https://github.com/graphql/graphiql/commit/9df315b44896efa313ed6744445fc8f9e702ebc3) Thanks [@acao](https://github.com/acao)! - This introduces some big changes to `monaco-graphql`, and some exciting features, including multi-model support, multi-schema support, and variables json language feature support 🎉.

  see [the readme](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#monaco-graphql) to learn how to configure and use the new interface.

  #### 🚨 BREAKING CHANGES!! 🚨

  - `monaco-graphql` 🚨 **no longer loads schemas using `fetch` introspection** 🚨, you must specify the schema in one of many ways statically or dynamically. specifying just a schema `uri` no longer works. see [the readme](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#monaco-graphql)
  - when specifying the language to an editor or model, **use `graphql` as the language id instead of `graphqlDev`**
    - the mode now extends the default basic language support from `monaco-editor` itself
    - when bundling, for syntax highlighting and basic language features, you must specify `graphql` in languages for your webpack or vite monaco plugins
  - The exported mode api for configfuration been entirely rewritten. It is simple for now, but we will add more powerful methods to the `monaco.languages.api` over time :)

  #### New Features

  this introduces many improvements:

  - json language support, by mapping from each graphql model uri to a set of json variable model uris
    - we generate a json schema definition for the json variables on the fly
    - it updates alongside editor validation as you type
  - less redundant schema loading - schema is loaded in main process instead of in the webworker
  - web worker stability has been improved by contributors in previous patches, but removing remote schema loading vastly simplifies worker creation
  - the editor now supports multiple graphql models, configurable against multiple schema configurations

  * You can now use `intializeMode()` to initialize the language mode & worker with the schema, but you can still lazily load it, and fall back on default monaco editor basic languages support

### Patch Changes

- Updated dependencies [[`581df6d8`](https://github.com/graphql/graphiql/commit/581df6d83f4bc145de94e5d730b00e5b025907da), [`9df315b4`](https://github.com/graphql/graphiql/commit/9df315b44896efa313ed6744445fc8f9e702ebc3), [`9b72af57`](https://github.com/graphql/graphiql/commit/9b72af57183f4435992c232e63506ad2f5a72576)]:
  - graphql-language-service-interface@2.10.0
  - graphql-language-service-utils@2.7.0

## 3.2.5

### Patch Changes

- [`df57cd25`](https://github.com/graphql/graphiql/commit/df57cd2556302d6aa5dd140e7bee3f7bdab4deb1) [#2065](https://github.com/graphql/graphiql/pull/2065) Thanks [@acao](https://github.com/acao)! - Add an opt-in feature to generate markdown in hover elements, starting with highlighting type information. Enabled for the language server and also the language service and thus `monaco-graphql` as well.

- Updated dependencies [[`989fca69`](https://github.com/graphql/graphiql/commit/989fca693385aa408bcfe18cde34934a5aea5dce), [`df57cd25`](https://github.com/graphql/graphiql/commit/df57cd2556302d6aa5dd140e7bee3f7bdab4deb1)]:
  - graphql-language-service-interface@2.9.5

## 3.2.4

### Patch Changes

- Updated dependencies [[`a3782ff0`](https://github.com/graphql/graphiql/commit/a3782ff0ff0d7c321e6f70bea61b1969b1690f26)]:
  - graphql-language-service-interface@2.9.4
  - graphql-language-service-types@1.8.6
  - graphql-language-service-parser@1.10.3
  - graphql-language-service-utils@2.6.3

## 3.2.3

### Patch Changes

- [`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf) [#2047](https://github.com/graphql/graphiql/pull/2047) Thanks [@willstott101](https://github.com/willstott101)! - Source code included in all packages to fix source maps. codemirror-graphql includes esm build in package.

- Updated dependencies [[`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf)]:
  - graphql-language-service-interface@2.9.3
  - graphql-language-service-parser@1.10.2
  - graphql-language-service-types@1.8.5
  - graphql-language-service-utils@2.6.2

## 3.2.2

### Patch Changes

- [`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf) [#2045](https://github.com/graphql/graphiql/pull/2045) Thanks [@acao](https://github.com/acao)! - fix graphql-js peer dependencies - [#2044](https://github.com/graphql/graphiql/pull/2044)

- Updated dependencies [[`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf)]:
  - graphql-language-service-interface@2.9.2
  - graphql-language-service-parser@1.10.1
  - graphql-language-service-types@1.8.4
  - graphql-language-service-utils@2.6.1

## 3.2.1

### Patch Changes

- [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce) [#2013](https://github.com/graphql/graphiql/pull/2013) Thanks [@PabloSzx](https://github.com/PabloSzx)! - Update utils

- Updated dependencies [[`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce), [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce), [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce)]:
  - graphql-language-service-utils@2.6.0
  - graphql-language-service-types@1.8.3
  - graphql-language-service-interface@2.9.1

## 3.2.0

### Minor Changes

- [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a) [#2010](https://github.com/graphql/graphiql/pull/2010) Thanks [@acao](https://github.com/acao)! - upgrade to `graphql@16.0.0-experimental-stream-defer.5`. thanks @saihaj!

### Patch Changes

- Updated dependencies [[`8869c4b1`](https://github.com/graphql/graphiql/commit/8869c4b18c900b9b35556255587ef5130a96a4d5), [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a)]:
  - graphql-language-service-interface@2.9.0
  - graphql-language-service-parser@1.10.0

## 3.1.6

### Patch Changes

- [`0e2c1a02`](https://github.com/graphql/graphiql/commit/0e2c1a020cc2761155f7c9467d3ed4cb45941aeb) [#1979](https://github.com/graphql/graphiql/pull/1979) Thanks [@iahu](https://github.com/iahu)! - fix: export `monaco-graphql` esm with esm modules, also fix issues with worker manager, resolves #1706 & #1791

* [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8) [#1777](https://github.com/graphql/graphiql/pull/1777) Thanks [@dwwoelfel](https://github.com/dwwoelfel)! - adopt block string parsing for variables in language parser

* Updated dependencies [[`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8)]:
  - graphql-language-service-parser@1.9.3

## 3.1.5

### Patch Changes

- [`2fd5bf72`](https://github.com/graphql/graphiql/commit/2fd5bf7239edb78339e5ac7211f09c245e47c3bb) [#1941](https://github.com/graphql/graphiql/pull/1941) Thanks [@arcanis](https://github.com/arcanis)! - Adds support for `#graphql` and `/* GraphQL */` in the language server

## 3.1.4

### Patch Changes

- [`5b8a057d`](https://github.com/graphql/graphiql/commit/5b8a057dd64ebecc391be32176a2403bb9d9ff92) [#1838](https://github.com/graphql/graphiql/pull/1838) Thanks [@acao](https://github.com/acao)! - Set all cross-runtime build targets to es6

## 3.1.3

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

## [3.1.2](https://github.com/graphql/graphiql/compare/graphql-language-service@3.1.1...graphql-language-service@3.1.2) (2021-01-07)

**Note:** Version bump only for package graphql-language-service

## [3.1.1](https://github.com/graphql/graphiql/compare/graphql-language-service@3.1.0...graphql-language-service@3.1.1) (2021-01-07)

**Note:** Version bump only for package graphql-language-service

## [3.1.0](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.6...graphql-language-service@3.1.0) (2021-01-07)

### Features

- implied or external fragments, for [#612](https://github.com/graphql/graphiql/issues/612) ([#1750](https://github.com/graphql/graphiql/issues/1750)) ([cfed265](https://github.com/graphql/graphiql/commit/cfed265e3cf31875b39ea517781a217fcdfcadc2))

## [3.0.6](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.5...graphql-language-service@3.0.6) (2021-01-03)

**Note:** Version bump only for package graphql-language-service

## [3.0.5](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.4...graphql-language-service@3.0.5) (2020-12-28)

**Note:** Version bump only for package graphql-language-service

## [3.0.4](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.3...graphql-language-service@3.0.4) (2020-12-08)

**Note:** Version bump only for package graphql-language-service

## [3.0.3](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.2...graphql-language-service@3.0.3) (2020-11-28)

**Note:** Version bump only for package graphql-language-service

## [3.0.2](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.2-alpha.3...graphql-language-service@3.0.2) (2020-09-18)

**Note:** Version bump only for package graphql-language-service

## [3.0.2-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.2-alpha.2...graphql-language-service@3.0.2-alpha.3) (2020-09-11)

**Note:** Version bump only for package graphql-language-service

## [3.0.2-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.2-alpha.1...graphql-language-service@3.0.2-alpha.2) (2020-08-22)

### Bug Fixes

- improve setSchema & schema loading, allow primitive schema ([#1648](https://github.com/graphql/graphiql/issues/1648)) ([975f29e](https://github.com/graphql/graphiql/commit/975f29ed6e21c7354c42ed778dfd1b52287f70c6))

## [3.0.2-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.2-alpha.0...graphql-language-service@3.0.2-alpha.1) (2020-08-12)

**Note:** Version bump only for package graphql-language-service

## [3.0.2-alpha.0](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.1...graphql-language-service@3.0.2-alpha.0) (2020-08-10)

**Note:** Version bump only for package graphql-language-service

## [3.0.1](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.0...graphql-language-service@3.0.1) (2020-08-06)

**Note:** Version bump only for package graphql-language-service

## [3.0.0](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.0-alpha.4...graphql-language-service@3.0.0) (2020-06-11)

### Features

- standalone monaco API ([#1575](https://github.com/graphql/graphiql/issues/1575)) ([954aa3d](https://github.com/graphql/graphiql/commit/954aa3d7159fd26bba9650824e0f668e417ca64f))

## [3.0.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.0-alpha.3...graphql-language-service@3.0.0-alpha.4) (2020-06-04)

**Note:** Version bump only for package graphql-language-service

## [3.0.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.0-alpha.2...graphql-language-service@3.0.0-alpha.3) (2020-06-04)

### Bug Fixes

- cleanup cache entry from lerna publish ([4a26218](https://github.com/graphql/graphiql/commit/4a2621808a1aea8b30d5d27b8d86a60bf2b44b01))

## [3.0.0-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service@3.0.0-alpha.1...graphql-language-service@3.0.0-alpha.2) (2020-05-28)

**Note:** Version bump only for package graphql-language-service

## [3.0.0-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.8...graphql-language-service@3.0.0-alpha.1) (2020-05-19)

**Note:** Version bump only for package graphql-language-service

# 2.4.0-alpha.8 (2020-05-17)

### Features

- Monaco Mode - Phase 2 - Mode & Worker ([#1459](https://github.com/graphql/graphiql/issues/1459)) ([bc95fb4](https://github.com/graphql/graphiql/commit/bc95fb46459a4437ff9471ff43c98e1c5c50f51e))
- monaco-graphql docs, api, improvements ([#1521](https://github.com/graphql/graphiql/issues/1521)) ([c79158c](https://github.com/graphql/graphiql/commit/c79158c72e976ab286e7ec3fded7f3e2d24e50d0))
- new graphql-languageservice package ([#1485](https://github.com/graphql/graphiql/issues/1485)) ([6bb3ddd](https://github.com/graphql/graphiql/commit/6bb3dddf1f97db4bc193bb7fd9de1ada8d8c8ef9))
