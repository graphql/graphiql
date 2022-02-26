# graphql-language-service-utils

## 2.7.1

### Patch Changes

- [#2091](https://github.com/graphql/graphiql/pull/2091) [`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63) Thanks [@acao](https://github.com/acao)! - Fix graphql 15 related issues. Should now build & test interchangeably.

- Updated dependencies [[`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63)]:
  - graphql-language-service-types@1.8.7

## 2.7.0

### Minor Changes

- [#1997](https://github.com/graphql/graphiql/pull/1997) [`9df315b4`](https://github.com/graphql/graphiql/commit/9df315b44896efa313ed6744445fc8f9e702ebc3) Thanks [@acao](https://github.com/acao)! - This introduces some big changes to `monaco-graphql`, and some exciting features, including multi-model support, multi-schema support, and variables json language feature support 🎉.

  see [the readme](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#monaco-graphql) to learn how to configure and use the new interface.

  #### 🚨 BREAKING CHANGES!! 🚨

  - `monaco-graphql` 🚨 **no longer loads schemas using `fetch` introspection** 🚨, you must specify the schema in one of many ways statically or dynamically. specifying just a schema `uri` no longer works. see [the readme](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#monaco-graphql)
  - when specifying the language to an editor or model, **use `graphql` as the language id instead of `graphqlDev`**
    - the mode now extends the default basic language support from `monaco-editor` itself
    - when bundling, for syntax highlighting and basic language features, you must specify `graphql` in languages for your webpack or vite monaco plugins
  - The exported mode api for configuration been entirely rewritten. It is simple for now, but we will add more powerful methods to the `monaco.languages.api` over time :)

  #### New Features

  this introduces many improvements:

  - json language support, by mapping from each graphql model uri to a set of json variable model uris
    - we generate a json schema definition for the json variables on the fly
    - it updates alongside editor validation as you type
  - less redundant schema loading - schema is loaded in main process instead of in the webworker
  - web worker stability has been improved by contributors in previous patches, but removing remote schema loading vastly simplifies worker creation
  - the editor now supports multiple graphql models, configurable against multiple schema configurations

  * You can now use `initializeMode()` to initialize the language mode & worker with the schema, but you can still lazily load it, and fall back on default monaco editor basic languages support

## 2.6.3

### Patch Changes

- Updated dependencies [[`a3782ff0`](https://github.com/graphql/graphiql/commit/a3782ff0ff0d7c321e6f70bea61b1969b1690f26)]:
  - graphql-language-service-types@1.8.6

## 2.6.2

### Patch Changes

- [`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf) [#2047](https://github.com/graphql/graphiql/pull/2047) Thanks [@willstott101](https://github.com/willstott101)! - Source code included in all packages to fix source maps. codemirror-graphql includes esm build in package.

- Updated dependencies [[`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf)]:
  - graphql-language-service-types@1.8.5

## 2.6.1

### Patch Changes

- [`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf) [#2045](https://github.com/graphql/graphiql/pull/2045) Thanks [@acao](https://github.com/acao)! - fix graphql-js peer dependencies - [#2044](https://github.com/graphql/graphiql/pull/2044)

- Updated dependencies [[`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf)]:
  - graphql-language-service-types@1.8.4

## 2.6.0

### Minor Changes

- [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce) [#2013](https://github.com/graphql/graphiql/pull/2013) Thanks [@PabloSzx](https://github.com/PabloSzx)! - upgrade to `graphql@16.0.0-experimental-stream-defer.5`

### Patch Changes

- Updated dependencies [[`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce)]:
  - graphql-language-service-types@1.8.3

## 2.5.3

### Patch Changes

- [`5b8a057d`](https://github.com/graphql/graphiql/commit/5b8a057dd64ebecc391be32176a2403bb9d9ff92) [#1838](https://github.com/graphql/graphiql/pull/1838) Thanks [@acao](https://github.com/acao)! - Set all cross-runtime build targets to es6

## 2.5.2

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

## [2.5.1](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.5.0...graphql-language-service-utils@2.5.1) (2021-01-07)

### Bug Fixes

- add missing nullthrows dependency to utils ([#1753](https://github.com/graphql/graphiql/issues/1753)) ([40e75a1](https://github.com/graphql/graphiql/commit/40e75a18b8fbc392c6d14e294ce9b6804b67f103))

## [2.5.0](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.4...graphql-language-service-utils@2.5.0) (2021-01-07)

### Features

- implied or external fragments, for [#612](https://github.com/graphql/graphiql/issues/612) ([#1750](https://github.com/graphql/graphiql/issues/1750)) ([cfed265](https://github.com/graphql/graphiql/commit/cfed265e3cf31875b39ea517781a217fcdfcadc2))

## [2.4.4](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.3...graphql-language-service-utils@2.4.4) (2021-01-03)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.3](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.2...graphql-language-service-utils@2.4.3) (2020-09-18)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.2](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.1...graphql-language-service-utils@2.4.2) (2020-09-11)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.1](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0...graphql-language-service-utils@2.4.1) (2020-08-06)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.0](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.9...graphql-language-service-utils@2.4.0) (2020-06-11)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.0-alpha.9](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.8...graphql-language-service-utils@2.4.0-alpha.9) (2020-06-04)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.0-alpha.8](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.7...graphql-language-service-utils@2.4.0-alpha.8) (2020-06-04)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.0-alpha.7](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.6...graphql-language-service-utils@2.4.0-alpha.7) (2020-05-17)

### Bug Fixes

- remove problematic file resolution module from webpack sco… ([#1489](https://github.com/graphql/graphiql/issues/1489)) ([8dab038](https://github.com/graphql/graphiql/commit/8dab0385772f443f73b559e2c668080733168236))

## [2.4.0-alpha.6](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.5...graphql-language-service-utils@2.4.0-alpha.6) (2020-04-10)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.0-alpha.5](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.4...graphql-language-service-utils@2.4.0-alpha.5) (2020-04-06)

### Features

- upgrade to graphql@15.0.0 for [#1191](https://github.com/graphql/graphiql/issues/1191) ([#1204](https://github.com/graphql/graphiql/issues/1204)) ([f13c8e9](https://github.com/graphql/graphiql/commit/f13c8e9d0e66df4b051b332c7d02f4bb83e07ffd))

## [2.4.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.3...graphql-language-service-utils@2.4.0-alpha.4) (2020-04-03)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.2...graphql-language-service-utils@2.4.0-alpha.3) (2020-03-20)

**Note:** Version bump only for package graphql-language-service-utils

## [2.4.0-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.4.0-alpha.0...graphql-language-service-utils@2.4.0-alpha.2) (2020-03-20)

### Bug Fixes

- exclusions rule for custom rules ([2bdc132](https://github.com/graphql/graphiql/commit/2bdc132abb3b1a0c5ad644e53a2c6e070a2185ce))

### Features

- use new GraphQL Config ([#1342](https://github.com/graphql/graphiql/issues/1342)) ([e45838f](https://github.com/graphql/graphiql/commit/e45838f5ba579e05b20f1a147ce431478ffad9aa))

## [2.4.0-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.3.3...graphql-language-service-utils@2.4.0-alpha.1) (2020-01-18)

### Bug Fixes

- hmr, file resolution warnings ([69bf701](https://github.com/graphql/graphiql/commit/69bf701))
- linting issues, trailingCommas: all ([#1099](https://github.com/graphql/graphiql/issues/1099)) ([de4005b](https://github.com/graphql/graphiql/commit/de4005b))

### Features

- convert LSP Server to Typescript, remove watchman ([#1138](https://github.com/graphql/graphiql/issues/1138)) ([8e33dbb](https://github.com/graphql/graphiql/commit/8e33dbb))

## [2.3.3](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.3.2...graphql-language-service-utils@2.3.3) (2019-12-09)

### Bug Fixes

- test output, webpack resolution, clean build ([3b1c2c1](https://github.com/graphql/graphiql/commit/3b1c2c1))
- **gls-utils:** [#1055](https://github.com/graphql/graphiql/issues/1055) - move file test, refactor for fixtures ([19d8d7f](https://github.com/graphql/graphiql/commit/19d8d7f))

## [2.3.2](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.3.1...graphql-language-service-utils@2.3.2) (2019-12-03)

### Bug Fixes

- convert browserify build to webpack, fixes [#976](https://github.com/graphql/graphiql/issues/976) ([#1001](https://github.com/graphql/graphiql/issues/1001)) ([3caf041](https://github.com/graphql/graphiql/commit/3caf041))

## [2.3.1](https://github.com/graphql/graphiql/compare/graphql-language-service-utils@2.3.0...graphql-language-service-utils@2.3.1) (2019-11-26)

### Bug Fixes

- webpack resolutions for [#882](https://github.com/graphql/graphiql/issues/882), add webpack example ([ea9df3e](https://github.com/graphql/graphiql/commit/ea9df3e))

# 2.3.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.0.1 (2017-03-29)

# 2.2.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.0.1 (2017-03-29)

# 2.2.0-alpha.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.0.1 (2017-03-29)

## 2.1.1-alpha.1 (2019-09-01)

## 0.0.1 (2017-03-29)

**Note:** Version bump only for package graphql-language-service-utils

## 2.1.1-alpha.0 (2019-09-01)

## 0.0.1 (2017-03-29)

**Note:** Version bump only for package graphql-language-service-utils

## 2.1.1 (2019-09-01)

## 0.0.1 (2017-03-29)

**Note:** Version bump only for package graphql-language-service-utils
