# graphql-language-service-server

## 2.7.7

### Patch Changes

- [`c4236190`](https://github.com/graphql/graphiql/commit/c4236190f91adedaf4f4a54cd0400a6b42c3c407) [#2072](https://github.com/graphql/graphiql/pull/2072) Thanks [@acao](https://github.com/acao)! - this fixes the parsing of file URIs by `graphql-language-service-server` in cases such as:

  - windows without WSL
  - special characters in filenames
  - likely other cases

  previously we were using the old approach of `URL(uri).pathname` which was not working! now using the standard `vscode-uri` approach of `URI.parse(uri).fsName`.

  this should fix issues with object and fragment type completion as well I think

  also for #2066 made it so that graphql config is not loaded into the file cache unnecessarily, and that it's only loaded on editor save events rather than on file changed events

  fixes #1644 and #2066

* [`df57cd25`](https://github.com/graphql/graphiql/commit/df57cd2556302d6aa5dd140e7bee3f7bdab4deb1) [#2065](https://github.com/graphql/graphiql/pull/2065) Thanks [@acao](https://github.com/acao)! - Add an opt-in feature to generate markdown in hover elements, starting with highlighting type information. Enabled for the language server and also the language service and thus `monaco-graphql` as well.

* Updated dependencies [[`df57cd25`](https://github.com/graphql/graphiql/commit/df57cd2556302d6aa5dd140e7bee3f7bdab4deb1)]:
  - graphql-language-service@3.2.5

## 2.7.6

### Patch Changes

- [`4286185c`](https://github.com/graphql/graphiql/commit/4286185cdc6119175e23d66b8e177ba32693a63a) [#2060](https://github.com/graphql/graphiql/pull/2060) Thanks [@acao](https://github.com/acao)! - Parse more JS extensions in the language server

## 2.7.5

### Patch Changes

- [`f82bd7a9`](https://github.com/graphql/graphiql/commit/f82bd7a931eb5fa9a33e59d417303706844c9063) [#2055](https://github.com/graphql/graphiql/pull/2055) Thanks [@acao](https://github.com/acao)! - this fixes the URI scheme related bugs and make sure schema as sdl config works again.

  `fileURLToPath` had been introduced by a contributor and I didnt test properly, it broke sdl file loading!

  definitions, autocomplete, diagnostics, etc should work again
  also hides the more verbose logging output for now

- Updated dependencies []:
  - graphql-language-service@3.2.4
  - graphql-language-service-utils@2.6.3

## 2.7.4

### Patch Changes

- [`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf) [#2047](https://github.com/graphql/graphiql/pull/2047) Thanks [@willstott101](https://github.com/willstott101)! - Source code included in all packages to fix source maps. codemirror-graphql includes esm build in package.

- Updated dependencies [[`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf)]:
  - graphql-language-service@3.2.3
  - graphql-language-service-utils@2.6.2

## 2.7.3

### Patch Changes

- [`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf) [#2045](https://github.com/graphql/graphiql/pull/2045) Thanks [@acao](https://github.com/acao)! - fix graphql-js peer dependencies - [#2044](https://github.com/graphql/graphiql/pull/2044)

- Updated dependencies [[`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf)]:
  - graphql-language-service@3.2.2
  - graphql-language-service-utils@2.6.1

## 2.7.2

### Patch Changes

- [`7e98c6ff`](https://github.com/graphql/graphiql/commit/7e98c6fff3b1c62954c9c8d902ac64ddbf23fc5d) Thanks [@acao](https://github.com/acao)! - ugprade graphql-language-service-server to use graphql-config 4.1.0!
  adds support for .ts and .toml config files in the language server, amongst many other improvements!

## 2.7.1

### Patch Changes

- [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce) [#2013](https://github.com/graphql/graphiql/pull/2013) Thanks [@PabloSzx](https://github.com/PabloSzx)! - Update utils

- Updated dependencies [[`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce), [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce)]:
  - graphql-language-service-utils@2.6.0
  - graphql-language-service@3.2.1

## 2.7.0

### Minor Changes

- [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a) [#2010](https://github.com/graphql/graphiql/pull/2010) Thanks [@acao](https://github.com/acao)! - upgrade to `graphql@16.0.0-experimental-stream-defer.5`. thanks @saihaj!

### Patch Changes

- Updated dependencies [[`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a)]:
  - graphql-language-service@3.2.0

## 2.6.5

### Patch Changes

- [`83c4a007`](https://github.com/graphql/graphiql/commit/83c4a0070a4df704ce874ec977d65ca6c7e43ee8) [#1964](https://github.com/graphql/graphiql/pull/1964) Thanks [@patrickszmucer](https://github.com/patrickszmucer)! - Fix unknown fragment errors on save

* [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8) [#1777](https://github.com/graphql/graphiql/pull/1777) Thanks [@dwwoelfel](https://github.com/dwwoelfel)! - adopt block string parsing for variables in language parser

* Updated dependencies [[`0e2c1a02`](https://github.com/graphql/graphiql/commit/0e2c1a020cc2761155f7c9467d3ed4cb45941aeb), [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8)]:
  - graphql-language-service@3.1.6

## 2.6.4

### Patch Changes

- [`72bff0e7`](https://github.com/graphql/graphiql/commit/72bff0e7db46fb53293efc990dc64d2c06401459) [#1951](https://github.com/graphql/graphiql/pull/1951) Thanks [@GoodForOneFare](https://github.com/GoodForOneFare)! - fix: skip config updates when no custom filename is defined

* [`2fd5bf72`](https://github.com/graphql/graphiql/commit/2fd5bf7239edb78339e5ac7211f09c245e47c3bb) [#1941](https://github.com/graphql/graphiql/pull/1941) Thanks [@arcanis](https://github.com/arcanis)! - Adds support for `#graphql` and `/* GraphQL */` in the language server

* Updated dependencies [[`2fd5bf72`](https://github.com/graphql/graphiql/commit/2fd5bf7239edb78339e5ac7211f09c245e47c3bb)]:
  - graphql-language-service@3.1.5

## 2.6.3

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

## [2.6.2](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.6.1...graphql-language-service-server@2.6.2) (2021-01-07)

**Note:** Version bump only for package graphql-language-service-server

## [2.6.1](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.6.0...graphql-language-service-server@2.6.1) (2021-01-07)

**Note:** Version bump only for package graphql-language-service-server

## [2.6.0](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.9...graphql-language-service-server@2.6.0) (2021-01-07)

### Features

- implied or external fragments, for [#612](https://github.com/graphql/graphiql/issues/612) ([#1750](https://github.com/graphql/graphiql/issues/1750)) ([cfed265](https://github.com/graphql/graphiql/commit/cfed265e3cf31875b39ea517781a217fcdfcadc2))

## [2.5.9](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.8...graphql-language-service-server@2.5.9) (2021-01-03)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.8](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.7...graphql-language-service-server@2.5.8) (2020-12-28)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.7](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.6...graphql-language-service-server@2.5.7) (2020-12-08)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.6](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.5...graphql-language-service-server@2.5.6) (2020-11-28)

### Bug Fixes

- crash on receiving an LSP message in "stream" mode ([1238075](https://github.com/graphql/graphiql/commit/1238075c5bbd18b09f493c0018da5e4b24e8e615)), closes [#1708](https://github.com/graphql/graphiql/issues/1708)
- languageserver filepath on Windows ([#1715](https://github.com/graphql/graphiql/issues/1715)) ([d2feff9](https://github.com/graphql/graphiql/commit/d2feff92aba979fb52fd0e5846776be223fbf11e))

## [2.5.5](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.4...graphql-language-service-server@2.5.5) (2020-10-20)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.4](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.3...graphql-language-service-server@2.5.4) (2020-09-23)

### Bug Fixes

- useSchemaFileDefinitions, cleanup ([#1674](https://github.com/graphql/graphiql/issues/1674)) ([3673455](https://github.com/graphql/graphiql/commit/36734557e2874384adbfe86b64aeaa93e06df53f))

## [2.5.3](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.2...graphql-language-service-server@2.5.3) (2020-09-23)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.2](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.1...graphql-language-service-server@2.5.2) (2020-09-20)

### Bug Fixes

- re-introduce allowed extensions ([#1668](https://github.com/graphql/graphiql/issues/1668)) ([eedd575](https://github.com/graphql/graphiql/commit/eedd5753751857bd5837dd8be8602bf7fadb5517))

## [2.5.1](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.0...graphql-language-service-server@2.5.1) (2020-09-20)

### Bug Fixes

- better error handling when the config isn't present ([#1667](https://github.com/graphql/graphiql/issues/1667)) ([f414300](https://github.com/graphql/graphiql/commit/f4143008f93a8849dfa4caae948d2eceb299a141))

## [2.5.0](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.0-alpha.5...graphql-language-service-server@2.5.0) (2020-09-18)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.0-alpha.5](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.0-alpha.4...graphql-language-service-server@2.5.0-alpha.5) (2020-09-11)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.0-alpha.3...graphql-language-service-server@2.5.0-alpha.4) (2020-08-26)

### Features

- custom config baseDir, embedded fragment def offsets ([#1651](https://github.com/graphql/graphiql/issues/1651)) ([e8dc958](https://github.com/graphql/graphiql/commit/e8dc958b46544022fe58b498ca5eef572f54afe0))

## [2.5.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.0-alpha.2...graphql-language-service-server@2.5.0-alpha.3) (2020-08-22)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.0-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.0-alpha.1...graphql-language-service-server@2.5.0-alpha.2) (2020-08-12)

**Note:** Version bump only for package graphql-language-service-server

## [2.5.0-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.5.0-alpha.0...graphql-language-service-server@2.5.0-alpha.1) (2020-08-12)

### Bug Fixes

- recursively write tmp directories, write schema async ([#1641](https://github.com/graphql/graphiql/issues/1641)) ([cd0061e](https://github.com/graphql/graphiql/commit/cd0061e1abe47f5f4075d52a6c1e4157cbd0a95a))

## [2.5.0-alpha.0](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.1...graphql-language-service-server@2.5.0-alpha.0) (2020-08-10)

### Bug Fixes

- pre-cacheing schema bugs, new server config options ([#1636](https://github.com/graphql/graphiql/issues/1636)) ([d989456](https://github.com/graphql/graphiql/commit/d9894564c056134e15093956e0951dcefe061d76))

### Features

- graphql-config@3 support in lsp server ([#1616](https://github.com/graphql/graphiql/issues/1616)) ([27cd185](https://github.com/graphql/graphiql/commit/27cd18562b64dfe18e6343b6a49f3f606af89d86))

## [2.4.1](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0...graphql-language-service-server@2.4.1) (2020-08-06)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.12...graphql-language-service-server@2.4.0) (2020-06-11)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0-alpha.12](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.11...graphql-language-service-server@2.4.0-alpha.12) (2020-06-04)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0-alpha.11](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.10...graphql-language-service-server@2.4.0-alpha.11) (2020-06-04)

### Bug Fixes

- cleanup cache entry from lerna publish ([4a26218](https://github.com/graphql/graphiql/commit/4a2621808a1aea8b30d5d27b8d86a60bf2b44b01))

## [2.4.0-alpha.10](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.9...graphql-language-service-server@2.4.0-alpha.10) (2020-05-28)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0-alpha.9](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.8...graphql-language-service-server@2.4.0-alpha.9) (2020-05-19)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0-alpha.8](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.7...graphql-language-service-server@2.4.0-alpha.8) (2020-05-17)

### Bug Fixes

- remove problematic file resolution module from webpack sco… ([#1489](https://github.com/graphql/graphiql/issues/1489)) ([8dab038](https://github.com/graphql/graphiql/commit/8dab0385772f443f73b559e2c668080733168236))
- repair CLI, handle all schema and LSP errors ([#1482](https://github.com/graphql/graphiql/issues/1482)) ([992f384](https://github.com/graphql/graphiql/commit/992f38494f20f5877bfd6ff54893854ac7a0eaa2))

### Features

- Monaco Mode - Phase 2 - Mode & Worker ([#1459](https://github.com/graphql/graphiql/issues/1459)) ([bc95fb4](https://github.com/graphql/graphiql/commit/bc95fb46459a4437ff9471ff43c98e1c5c50f51e))

## [2.4.0-alpha.7](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.6...graphql-language-service-server@2.4.0-alpha.7) (2020-04-10)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0-alpha.6](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.5...graphql-language-service-server@2.4.0-alpha.6) (2020-04-10)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0-alpha.5](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.4...graphql-language-service-server@2.4.0-alpha.5) (2020-04-06)

### Features

- upgrade to graphql@15.0.0 for [#1191](https://github.com/graphql/graphiql/issues/1191) ([#1204](https://github.com/graphql/graphiql/issues/1204)) ([f13c8e9](https://github.com/graphql/graphiql/commit/f13c8e9d0e66df4b051b332c7d02f4bb83e07ffd))

## [2.4.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.3...graphql-language-service-server@2.4.0-alpha.4) (2020-04-03)

### Bug Fixes

- make sure that custom parser is used if passed to process ([#1438](https://github.com/graphql/graphiql/issues/1438)) ([5e098a4](https://github.com/graphql/graphiql/commit/5e098a4a80a8e1cff4541ad34363ab2001fcda4a))

### Features

- make sure @ triggers directive completion automatically ([#1441](https://github.com/graphql/graphiql/issues/1441)) ([935220a](https://github.com/graphql/graphiql/commit/935220a68641b94af2598840b0ced3fd945f86dd))

## [2.4.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.2...graphql-language-service-server@2.4.0-alpha.3) (2020-03-20)

**Note:** Version bump only for package graphql-language-service-server

## [2.4.0-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.4.0-alpha.0...graphql-language-service-server@2.4.0-alpha.2) (2020-03-20)

### Bug Fixes

- eslint warnings ([#1360](https://github.com/graphql/graphiql/issues/1360)) ([84d4821](https://github.com/graphql/graphiql/commit/84d4821ee19030314666a46f11a4b69ffaddca45))
- initial request cache set, import tsc bugs ([#1266](https://github.com/graphql/graphiql/issues/1266)) ([6b98f8a](https://github.com/graphql/graphiql/commit/6b98f8a442d4a8ea160fb90a29acf33f5382db2e))
- restore error handling for server [#1306](https://github.com/graphql/graphiql/issues/1306) ([#1425](https://github.com/graphql/graphiql/issues/1425)) ([c12d975](https://github.com/graphql/graphiql/commit/c12d975027e4021bbea7ad54e7e0c19ac7943e6c))
- type check ([#1374](https://github.com/graphql/graphiql/issues/1374)) ([84cc41e](https://github.com/graphql/graphiql/commit/84cc41ef1c5b56d26929edd9669c766cdf3628e8))
- typo to fix hover ([#1426](https://github.com/graphql/graphiql/issues/1426)) ([1fdcb28](https://github.com/graphql/graphiql/commit/1fdcb28689bf85a31af10cbdc4648c5ed3013672))

### Features

- optionally provide LSP an instantiated GraphQLConfig ([#1432](https://github.com/graphql/graphiql/issues/1432)) ([012db2a](https://github.com/graphql/graphiql/commit/012db2a39bfcddde63ffd2e93dae0c158f8e73ed))
- typescript, tsx, jsx support for LSP server using babel ([#1427](https://github.com/graphql/graphiql/issues/1427)) ([ee06123](https://github.com/graphql/graphiql/commit/ee061235489c8f5ed27c116c09b606e371ee40c5))
- **graphql-config:** add graphql config extensions ([#1118](https://github.com/graphql/graphiql/issues/1118)) ([2a77e47](https://github.com/graphql/graphiql/commit/2a77e47719ec9181a00183a08ffa11287b8fd2f5))
- Symbol support for single document ([#1244](https://github.com/graphql/graphiql/issues/1244)) ([f729f9a](https://github.com/graphql/graphiql/commit/f729f9a3c20362f4515bf3037347a07cc3690b38))
- use new GraphQL Config ([#1342](https://github.com/graphql/graphiql/issues/1342)) ([e45838f](https://github.com/graphql/graphiql/commit/e45838f5ba579e05b20f1a147ce431478ffad9aa))

## [2.4.0-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.3.3...graphql-language-service-server@2.4.0-alpha.1) (2020-01-18)

### Bug Fixes

- linting issues, trailingCommas: all ([#1099](https://github.com/graphql/graphiql/issues/1099)) ([de4005b](https://github.com/graphql/graphiql/commit/de4005b))

### Features

- convert LSP Server to Typescript, remove watchman ([#1138](https://github.com/graphql/graphiql/issues/1138)) ([8e33dbb](https://github.com/graphql/graphiql/commit/8e33dbb))

## [2.3.3](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.3.2...graphql-language-service-server@2.3.3) (2019-12-09)

### Bug Fixes

- a few more tweaks to babel ignore ([e0ad2c6](https://github.com/graphql/graphiql/commit/e0ad2c6))

## [2.3.2](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.3.1...graphql-language-service-server@2.3.2) (2019-12-03)

### Bug Fixes

- convert browserify build to webpack, fixes [#976](https://github.com/graphql/graphiql/issues/976) ([#1001](https://github.com/graphql/graphiql/issues/1001)) ([3caf041](https://github.com/graphql/graphiql/commit/3caf041))

## [2.3.1](https://github.com/graphql/graphiql/compare/graphql-language-service-server@2.3.0...graphql-language-service-server@2.3.1) (2019-11-26)

**Note:** Version bump only for package graphql-language-service-server

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

**Note:** Version bump only for package graphql-language-service-server

## 2.1.1-alpha.0 (2019-09-01)

## 0.0.1 (2017-03-29)

**Note:** Version bump only for package graphql-language-service-server

## 2.1.1 (2019-09-01)

## 0.0.1 (2017-03-29)

**Note:** Version bump only for package graphql-language-service-server
