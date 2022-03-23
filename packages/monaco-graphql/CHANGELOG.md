# Change Log

## 1.0.13

### Patch Changes

- Updated dependencies [[`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa), [`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa)]:
  - graphql-language-service@5.0.1

## 1.0.12

### Patch Changes

- Updated dependencies [[`2502a364`](https://github.com/graphql/graphiql/commit/2502a364b74dc754d92baa1579b536cf42139958)]:
  - graphql-language-service@5.0.0

## 1.0.11

### Patch Changes

- [#2222](https://github.com/graphql/graphiql/pull/2222) [`33f4bf97`](https://github.com/graphql/graphiql/commit/33f4bf977d2c9e831bf9c3acb9c16365b9de2750) Thanks [@acao](https://github.com/acao)! - fixed lost this handle while parsing schema, thanks @waterfoul

## 1.0.10

### Patch Changes

- Updated dependencies [[`484c0523`](https://github.com/graphql/graphiql/commit/484c0523cdd529f9e261d61a38616b6745075c7f), [`5852ba47`](https://github.com/graphql/graphiql/commit/5852ba47c720a2577817aed512bef9a262254f2c), [`48c5df65`](https://github.com/graphql/graphiql/commit/48c5df654e323cee3b8c57d7414247465235d1b5)]:
  - graphql-language-service@4.1.5

## 1.0.9

### Patch Changes

- [#2118](https://github.com/graphql/graphiql/pull/2118) [`0d1122f9`](https://github.com/graphql/graphiql/commit/0d1122f9c8600ddd86022e72c0fa3696bb1e8b33) Thanks [@acao](https://github.com/acao)! - fix: monaco `getModeId` bug for `monaco-editor@^0.30.0`

  We fixed this already, but we reverted it because folks were having issues with older versions. This fix works for all versions of `monaco-editor` that we support!

## 1.0.8

### Patch Changes

- [#2116](https://github.com/graphql/graphiql/pull/2116) [`65a51d04`](https://github.com/graphql/graphiql/commit/65a51d04876d56560d3453a09eb93f2e296f462a) Thanks [@acao](https://github.com/acao)! - - `picomatch-browser` fork no longer uses `path`. these changes to remove node dependencies from `picomatch`, 99% of them are by another contributor, will eventually be merged into the actual `picomatch`
  - no `onLanguage` for `initializeMode` - always instantiate the mode when this is called directly! Fixes some editor creation race condition issues
  - introduce a demo using react + vite and minimal config, no workarounds! This will help us prototype for `@graphiql/react`
  - use `schemaValidation: 'error'` by default. allow user to override `validate` if they want.
  - always re-register providers on schema config changes. seems to fix some issues on lazy instantiation

## 1.0.7

### Patch Changes

- Updated dependencies []:
  - graphql-language-service@4.1.4

## 1.0.6

### Patch Changes

- [#2105](https://github.com/graphql/graphiql/pull/2105) [`f7dc1f12`](https://github.com/graphql/graphiql/commit/f7dc1f1299cee06e20b65f8e457d74bf1cb6f76f) Thanks [@acao](https://github.com/acao)! - Fix a bug where `_cacheSchemas()` was not being called by the language service

## 1.0.5

### Patch Changes

- [#2103](https://github.com/graphql/graphiql/pull/2103) [`a44772d6`](https://github.com/graphql/graphiql/commit/a44772d6af97254c4f159ea7237e842a3e3719e8) Thanks [@acao](https://github.com/acao)! - LangugeService should not be imported by `codemirror-graphql`, and thus `picomatch` should not be imported.

- Updated dependencies [[`a44772d6`](https://github.com/graphql/graphiql/commit/a44772d6af97254c4f159ea7237e842a3e3719e8)]:
  - graphql-language-service@4.1.3

## 1.0.4

### Patch Changes

- Updated dependencies [[`e20760fb`](https://github.com/graphql/graphiql/commit/e20760fbd95c13d6d549cba3faa15a59aee9a2c0)]:
  - graphql-language-service@4.1.2

## 1.0.3

### Patch Changes

- [#2093](https://github.com/graphql/graphiql/pull/2093) [`c875412f`](https://github.com/graphql/graphiql/commit/c875412faaf0e1fb374c27ddd26d7f9795003675) Thanks [@acao](https://github.com/acao)! - export LANGUAGE_ID from monaco-graphql again

## 1.0.2

### Patch Changes

- Updated dependencies [[`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63)]:
  - graphql-language-service-utils@2.7.1
  - graphql-language-service@4.1.1

## 1.0.1

### Patch Changes

- Updated dependencies [[`0f1f90ce`](https://github.com/graphql/graphiql/commit/0f1f90ce8f4a25ddebdaf7a9ddbe136214aa64a3)]:
  - graphql-language-service@4.1.0

## 1.0.0

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

- Updated dependencies [[`9df315b4`](https://github.com/graphql/graphiql/commit/9df315b44896efa313ed6744445fc8f9e702ebc3)]:
  - graphql-language-service-utils@2.7.0
  - graphql-language-service@4.0.0

## 0.6.5

### Patch Changes

- [`989fca69`](https://github.com/graphql/graphiql/commit/989fca693385aa408bcfe18cde34934a5aea5dce) [#2070](https://github.com/graphql/graphiql/pull/2070) Thanks [@acao](https://github.com/acao)! - Fix a bug with variable completion with duplicate `$` across the ecosytem. Introduce more `triggerCharacters` across monaco and the LSP server for autocompletion in far more cases

- Updated dependencies [[`df57cd25`](https://github.com/graphql/graphiql/commit/df57cd2556302d6aa5dd140e7bee3f7bdab4deb1)]:
  - graphql-language-service@3.2.5

## 0.6.4

### Patch Changes

- Updated dependencies []:
  - graphql-language-service@3.2.4
  - graphql-language-service-utils@2.6.3

## 0.6.3

### Patch Changes

- Updated dependencies [[`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf)]:
  - graphql-language-service@3.2.3
  - graphql-language-service-utils@2.6.2

## 0.6.2

### Patch Changes

- [`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf) [#2045](https://github.com/graphql/graphiql/pull/2045) Thanks [@acao](https://github.com/acao)! - fix graphql-js peer dependencies - [#2044](https://github.com/graphql/graphiql/pull/2044)

- Updated dependencies [[`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf)]:
  - graphql-language-service@3.2.2
  - graphql-language-service-utils@2.6.1

## 0.6.1

### Patch Changes

- [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce) [#2013](https://github.com/graphql/graphiql/pull/2013) Thanks [@PabloSzx](https://github.com/PabloSzx)! - Update utils

- Updated dependencies [[`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce), [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce)]:
  - graphql-language-service-utils@2.6.0
  - graphql-language-service@3.2.1

## 0.6.0

### Minor Changes

- [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a) [#2010](https://github.com/graphql/graphiql/pull/2010) Thanks [@acao](https://github.com/acao)! - upgrade to `graphql@16.0.0-experimental-stream-defer.5`. thanks @saihaj!

### Patch Changes

- Updated dependencies [[`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a)]:
  - graphql-language-service@3.2.0

## 0.5.1

### Patch Changes

- [`0e2c1a02`](https://github.com/graphql/graphiql/commit/0e2c1a020cc2761155f7c9467d3ed4cb45941aeb) [#1979](https://github.com/graphql/graphiql/pull/1979) Thanks [@iahu](https://github.com/iahu)! - fix: export `monaco-graphql` esm with esm modules, also fix issues with worker manager, resolves #1706 & #1791

* [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8) [#1777](https://github.com/graphql/graphiql/pull/1777) Thanks [@dwwoelfel](https://github.com/dwwoelfel)! - adopt block string parsing for variables in language parser

* Updated dependencies [[`0e2c1a02`](https://github.com/graphql/graphiql/commit/0e2c1a020cc2761155f7c9467d3ed4cb45941aeb), [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8)]:
  - graphql-language-service@3.1.6

## 0.5.0

### Minor Changes

- [`fec37c6b`](https://github.com/graphql/graphiql/commit/fec37c6b2953e177bea99d4cbf993c9b253198ba) [#1952](https://github.com/graphql/graphiql/pull/1952) Thanks [@Nishchit14](https://github.com/Nishchit14)! - devDependancy and peerDependancy of monaco-graphql has been upgraded for monaco-editor. monaco-graphql is now supporting latest version of monaco-editor which is v0.27.0

### Patch Changes

- Updated dependencies [[`2fd5bf72`](https://github.com/graphql/graphiql/commit/2fd5bf7239edb78339e5ac7211f09c245e47c3bb)]:
  - graphql-language-service@3.1.5

## 0.4.4

### Patch Changes

- [`5b8a057d`](https://github.com/graphql/graphiql/commit/5b8a057dd64ebecc391be32176a2403bb9d9ff92) [#1838](https://github.com/graphql/graphiql/pull/1838) Thanks [@acao](https://github.com/acao)! - Set all cross-runtime build targets to es6

## 0.4.3

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

## [0.4.2](https://github.com/graphql/graphiql/compare/monaco-graphql@0.4.1...monaco-graphql@0.4.2) (2021-01-07)

**Note:** Version bump only for package monaco-graphql

## [0.4.1](https://github.com/graphql/graphiql/compare/monaco-graphql@0.4.0...monaco-graphql@0.4.1) (2021-01-07)

**Note:** Version bump only for package monaco-graphql

# [0.4.0](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.5...monaco-graphql@0.4.0) (2021-01-07)

### Features

- implied or external fragments, for [#612](https://github.com/graphql/graphiql/issues/612) ([#1750](https://github.com/graphql/graphiql/issues/1750)) ([cfed265](https://github.com/graphql/graphiql/commit/cfed265e3cf31875b39ea517781a217fcdfcadc2))

## [0.3.5](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.4...monaco-graphql@0.3.5) (2021-01-03)

**Note:** Version bump only for package monaco-graphql

## [0.3.4](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.3...monaco-graphql@0.3.4) (2020-12-28)

**Note:** Version bump only for package monaco-graphql

## [0.3.3](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.2...monaco-graphql@0.3.3) (2020-12-08)

### Bug Fixes

- GraphQLAPI.setSchemaConfig README example ([#1726](https://github.com/graphql/graphiql/issues/1726)) ([01a1ff7](https://github.com/graphql/graphiql/commit/01a1ff74b0568229318339f9b026d99c117bd218))

## [0.3.2](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.1...monaco-graphql@0.3.2) (2020-11-28)

**Note:** Version bump only for package monaco-graphql

## [0.3.1](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.1-alpha.3...monaco-graphql@0.3.1) (2020-09-18)

**Note:** Version bump only for package monaco-graphql

## [0.3.1-alpha.3](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.1-alpha.2...monaco-graphql@0.3.1-alpha.3) (2020-09-11)

**Note:** Version bump only for package monaco-graphql

## [0.3.1-alpha.2](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.1-alpha.1...monaco-graphql@0.3.1-alpha.2) (2020-08-22)

### Bug Fixes

- improve setSchema & schema loading, allow primitive schema ([#1648](https://github.com/graphql/graphiql/issues/1648)) ([975f29e](https://github.com/graphql/graphiql/commit/975f29ed6e21c7354c42ed778dfd1b52287f70c6))

## [0.3.1-alpha.1](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.1-alpha.0...monaco-graphql@0.3.1-alpha.1) (2020-08-12)

**Note:** Version bump only for package monaco-graphql

## [0.3.1-alpha.0](https://github.com/graphql/graphiql/compare/monaco-graphql@0.3.0...monaco-graphql@0.3.1-alpha.0) (2020-08-10)

**Note:** Version bump only for package monaco-graphql

# [0.3.0](https://github.com/graphql/graphiql/compare/monaco-graphql@0.2.0...monaco-graphql@0.3.0) (2020-08-06)

### Features

- [RFC] GraphiQL rewrite for monaco editor, react context and redesign, i18n ([#1523](https://github.com/graphql/graphiql/issues/1523)) ([ad730cd](https://github.com/graphql/graphiql/commit/ad730cdc2e3cb7216d821a01725c60475989ee20))

# [0.2.0](https://github.com/graphql/graphiql/compare/monaco-graphql@0.1.4...monaco-graphql@0.2.0) (2020-06-11)

### Features

- standalone monaco API ([#1575](https://github.com/graphql/graphiql/issues/1575)) ([954aa3d](https://github.com/graphql/graphiql/commit/954aa3d7159fd26bba9650824e0f668e417ca64f))

## [0.1.4](https://github.com/graphql/graphiql/compare/monaco-graphql@0.1.3...monaco-graphql@0.1.4) (2020-06-04)

**Note:** Version bump only for package monaco-graphql

## [0.1.3](https://github.com/graphql/graphiql/compare/monaco-graphql@0.1.2...monaco-graphql@0.1.3) (2020-06-04)

### Bug Fixes

- cleanup cache entry from lerna publish ([4a26218](https://github.com/graphql/graphiql/commit/4a2621808a1aea8b30d5d27b8d86a60bf2b44b01))

## [0.1.2](https://github.com/graphql/graphiql/compare/monaco-graphql@0.1.1...monaco-graphql@0.1.2) (2020-05-28)

**Note:** Version bump only for package monaco-graphql

## [0.1.1](https://github.com/graphql/graphiql/compare/monaco-graphql@0.1.0...monaco-graphql@0.1.1) (2020-05-19)

**Note:** Version bump only for package monaco-graphql

# 0.1.0 (2020-05-17)

### Features

- Monaco Mode - Phase 2 - Mode & Worker ([#1459](https://github.com/graphql/graphiql/issues/1459)) ([bc95fb4](https://github.com/graphql/graphiql/commit/bc95fb46459a4437ff9471ff43c98e1c5c50f51e))
- monaco-graphql docs, api, improvements ([#1521](https://github.com/graphql/graphiql/issues/1521)) ([c79158c](https://github.com/graphql/graphiql/commit/c79158c72e976ab286e7ec3fded7f3e2d24e50d0))
