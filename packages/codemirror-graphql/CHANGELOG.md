# Change Log

## 1.2.8

### Patch Changes

- [#2091](https://github.com/graphql/graphiql/pull/2091) [`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63) Thanks [@acao](https://github.com/acao)! - Fix graphql 15 related issues. Should now build & test interchangeably.

- Updated dependencies []:
  - graphql-language-service@4.1.1

## 1.2.7

### Patch Changes

- Updated dependencies [[`0f1f90ce`](https://github.com/graphql/graphiql/commit/0f1f90ce8f4a25ddebdaf7a9ddbe136214aa64a3)]:
  - graphql-language-service@4.1.0

## 1.2.6

### Patch Changes

- Updated dependencies [[`9df315b4`](https://github.com/graphql/graphiql/commit/9df315b44896efa313ed6744445fc8f9e702ebc3)]:
  - graphql-language-service@4.0.0

## 1.2.5

### Patch Changes

- Updated dependencies [[`df57cd25`](https://github.com/graphql/graphiql/commit/df57cd2556302d6aa5dd140e7bee3f7bdab4deb1)]:
  - graphql-language-service@3.2.5

## 1.2.4

### Patch Changes

- Updated dependencies []:
  - graphql-language-service@3.2.4

## 1.2.3

### Patch Changes

- [`c42b145f`](https://github.com/graphql/graphiql/commit/c42b145fffeaefbd1103bc7addee1873e939bc83) [#2052](https://github.com/graphql/graphiql/pull/2052) Thanks [@imolorhe](https://github.com/imolorhe)! - Added cm6-legacy to published files list

## 1.2.2

### Patch Changes

- [`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf) [#2047](https://github.com/graphql/graphiql/pull/2047) Thanks [@willstott101](https://github.com/willstott101)! - Source code included in all packages to fix source maps. codemirror-graphql includes esm build in package.

* [`8b486555`](https://github.com/graphql/graphiql/commit/8b486555e2aa4d90891070a1bbc52b59d9c670c4) [#2046](https://github.com/graphql/graphiql/pull/2046) Thanks [@willstott101](https://github.com/willstott101)! - Further resolves #1944, replaces graphql-language-service-parser with graphql-language-service in codemirror-graphql

* Updated dependencies [[`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf)]:
  - graphql-language-service@3.2.3

## 1.2.1

### Patch Changes

- [`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf) [#2045](https://github.com/graphql/graphiql/pull/2045) Thanks [@acao](https://github.com/acao)! - fix graphql-js peer dependencies - [#2044](https://github.com/graphql/graphiql/pull/2044)

- Updated dependencies [[`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf)]:
  - graphql-language-service@3.2.2

## 1.2.0

### Minor Changes

- [`d0c22c4f`](https://github.com/graphql/graphiql/commit/d0c22c4fce5ea39611c7ecee553943fdf27fd03e) [#2035](https://github.com/graphql/graphiql/pull/2035) Thanks [@imolorhe](https://github.com/imolorhe)! - Added Codemirror 6 legacy support

### Patch Changes

- [`b79bf304`](https://github.com/graphql/graphiql/commit/b79bf304045add4b5c3b2539dd6b551a64e6ed87) [#2037](https://github.com/graphql/graphiql/pull/2037) Thanks [@acao](https://github.com/acao)! - Resolves #1944, replaces graphql-language-service-utils with graphql-language-service in codemirror-graphql

## 1.1.0

### Minor Changes

- [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a) [#2010](https://github.com/graphql/graphiql/pull/2010) Thanks [@acao](https://github.com/acao)! - upgrade to `graphql@16.0.0-experimental-stream-defer.5`. thanks @saihaj!

### Patch Changes

- Updated dependencies [[`8869c4b1`](https://github.com/graphql/graphiql/commit/8869c4b18c900b9b35556255587ef5130a96a4d5), [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a)]:
  - graphql-language-service-interface@2.9.0
  - graphql-language-service-parser@1.10.0

## 1.0.3

### Patch Changes

- [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8) [#1777](https://github.com/graphql/graphiql/pull/1777) Thanks [@dwwoelfel](https://github.com/dwwoelfel)! - adopt block string parsing for variables in language parser

- Updated dependencies [[`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8)]:
  - graphql-language-service-parser@1.9.3

## 1.0.2

### Patch Changes

- [`5b8a057d`](https://github.com/graphql/graphiql/commit/5b8a057dd64ebecc391be32176a2403bb9d9ff92) [#1838](https://github.com/graphql/graphiql/pull/1838) Thanks [@acao](https://github.com/acao)! - Set all cross-runtime build targets to es6

## 1.0.1

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

## 1.0.0

### Major Changes

- [`b4fc16c0`](https://github.com/graphql/graphiql/commit/b4fc16c025da6f466727dc17cab6026d14c6e7fe) Thanks [@imolorhe](https://github.com/imolorhe)! - BREAKING CHANGE Migrate to Typescript - [@imolorhe](https://github.com/imolorhe)

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.15.2](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.15.1...codemirror-graphql@0.15.2) (2021-01-07)

**Note:** Version bump only for package codemirror-graphql

## [0.15.1](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.15.0...codemirror-graphql@0.15.1) (2021-01-07)

### Bug Fixes

- bug with externalFragments in codemirror ([#1751](https://github.com/graphql/graphiql/issues/1751)) ([f423e61](https://github.com/graphql/graphiql/commit/f423e615330bf8529f4068889d6760501b732527))

## [0.15.0](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.14.0...codemirror-graphql@0.15.0) (2021-01-07)

### Features

- implied or external fragments, for [#612](https://github.com/graphql/graphiql/issues/612) ([#1750](https://github.com/graphql/graphiql/issues/1750)) ([cfed265](https://github.com/graphql/graphiql/commit/cfed265e3cf31875b39ea517781a217fcdfcadc2))

## [0.14.0](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.13.1...codemirror-graphql@0.14.0) (2021-01-03)

### Features

- merge completion logic (for implements &, variables) ([#1747](https://github.com/graphql/graphiql/issues/1747)) ([0ac0a85](https://github.com/graphql/graphiql/commit/0ac0a856cfc715d7885a9965a9a9114ef2ca4b1a))

## [0.13.1](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.13.0...codemirror-graphql@0.13.1) (2020-12-28)

**Note:** Version bump only for package codemirror-graphql

## [0.13.0](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.4...codemirror-graphql@0.13.0) (2020-12-08)

### Features

- provide validation rules via props ([#1716](https://github.com/graphql/graphiql/issues/1716)) ([0c5785c](https://github.com/graphql/graphiql/commit/0c5785c82adbd4affb25300ae2d128b42c9b81fe))

## [0.12.4](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.3...codemirror-graphql@0.12.4) (2020-11-28)

**Note:** Version bump only for package codemirror-graphql

## [0.12.3](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.2...codemirror-graphql@0.12.3) (2020-10-20)

### Bug Fixes

- **codemirror-graphql:** give interface field name suggestions ([#1695](https://github.com/graphql/graphiql/issues/1695)) ([669b301](https://github.com/graphql/graphiql/commit/669b3013fc679eca7c4e5c8ed6b0cd2fb2dbf2dc))

## [0.12.2](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.2-alpha.2...codemirror-graphql@0.12.2) (2020-09-18)

**Note:** Version bump only for package codemirror-graphql

## [0.12.2-alpha.2](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.2-alpha.1...codemirror-graphql@0.12.2-alpha.2) (2020-09-11)

**Note:** Version bump only for package codemirror-graphql

## [0.12.2-alpha.1](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.2-alpha.0...codemirror-graphql@0.12.2-alpha.1) (2020-08-12)

**Note:** Version bump only for package codemirror-graphql

## [0.12.2-alpha.0](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.1...codemirror-graphql@0.12.2-alpha.0) (2020-08-10)

**Note:** Version bump only for package codemirror-graphql

## [0.12.1](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0...codemirror-graphql@0.12.1) (2020-08-06)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.11...codemirror-graphql@0.12.0) (2020-06-11)

### Bug Fixes

- value of documentation in completion list ([#1567](https://github.com/graphql/graphiql/issues/1567)) ([39c00a5](https://github.com/graphql/graphiql/commit/39c00a55d7af43ce4e57ad9b1d5cd55393beb0d0))

## [0.12.0-alpha.11](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.10...codemirror-graphql@0.12.0-alpha.11) (2020-06-04)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.10](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.9...codemirror-graphql@0.12.0-alpha.10) (2020-06-04)

### Bug Fixes

- cleanup cache entry from lerna publish ([4a26218](https://github.com/graphql/graphiql/commit/4a2621808a1aea8b30d5d27b8d86a60bf2b44b01))
- make list type and non-nullable type available ([#902](https://github.com/graphql/graphiql/issues/902)) ([cea837f](https://github.com/graphql/graphiql/commit/cea837ff77c36dadb01b4302282821b00d7f5f2f))

## [0.12.0-alpha.9](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.8...codemirror-graphql@0.12.0-alpha.9) (2020-05-28)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.8](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.7...codemirror-graphql@0.12.0-alpha.8) (2020-05-17)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.7](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.6...codemirror-graphql@0.12.0-alpha.7) (2020-04-10)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.6](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.5...codemirror-graphql@0.12.0-alpha.6) (2020-04-10)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.5](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.4...codemirror-graphql@0.12.0-alpha.5) (2020-04-06)

### Features

- upgrade to graphql@15.0.0 for [#1191](https://github.com/graphql/graphiql/issues/1191) ([#1204](https://github.com/graphql/graphiql/issues/1204)) ([f13c8e9](https://github.com/graphql/graphiql/commit/f13c8e9d0e66df4b051b332c7d02f4bb83e07ffd))

## [0.12.0-alpha.4](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.3...codemirror-graphql@0.12.0-alpha.4) (2020-04-03)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.3](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.2...codemirror-graphql@0.12.0-alpha.3) (2020-03-20)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.2](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.12.0-alpha.0...codemirror-graphql@0.12.0-alpha.2) (2020-03-20)

**Note:** Version bump only for package codemirror-graphql

## [0.12.0-alpha.1](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.11.6...codemirror-graphql@0.12.0-alpha.1) (2020-01-18)

### Bug Fixes

- linting issues, trailingCommas: all ([#1099](https://github.com/graphql/graphiql/issues/1099)) ([de4005b](https://github.com/graphql/graphiql/commit/de4005b))
- screenshot/gif urls ([e3ea2fc](https://github.com/graphql/graphiql/commit/e3ea2fc))

### Features

- convert LSP Server to Typescript, remove watchman ([#1138](https://github.com/graphql/graphiql/issues/1138)) ([8e33dbb](https://github.com/graphql/graphiql/commit/8e33dbb))

## [0.11.6](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.11.5...codemirror-graphql@0.11.6) (2019-12-09)

### Bug Fixes

- codemirror results bundle ([dd06eb5](https://github.com/graphql/graphiql/commit/dd06eb5))

## [0.11.5](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.11.4...codemirror-graphql@0.11.5) (2019-12-09)

### Bug Fixes

- a few more tweaks to babel ignore ([e0ad2c6](https://github.com/graphql/graphiql/commit/e0ad2c6))

## [0.11.4](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.11.3...codemirror-graphql@0.11.4) (2019-12-03)

### Bug Fixes

- convert browserify build to webpack, fixes [#976](https://github.com/graphql/graphiql/issues/976) ([#1001](https://github.com/graphql/graphiql/issues/1001)) ([3caf041](https://github.com/graphql/graphiql/commit/3caf041))
- csp headers violation [@gracenoah](https://github.com/gracenoah) graphql/codemirror-graphql[#246](https://github.com/graphql/graphiql/issues/246) ([#1044](https://github.com/graphql/graphiql/issues/1044)) ([3c9dfa5](https://github.com/graphql/graphiql/commit/3c9dfa5))

## [0.11.3](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.11.2...codemirror-graphql@0.11.3) (2019-11-26)

**Note:** Version bump only for package codemirror-graphql

## [0.11.2](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.11.1...codemirror-graphql@0.11.2) (2019-10-19)

**Note:** Version bump only for package codemirror-graphql

## [0.11.1](https://github.com/graphql/graphiql/compare/codemirror-graphql@0.11.0...codemirror-graphql@0.11.1) (2019-10-04)

### Bug Fixes

- build tweaks ([0bc6a7c](https://github.com/graphql/graphiql/commit/0bc6a7c))

# 0.11.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

# 0.10.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.9.1-alpha.1 (2019-09-01)

**Note:** Version bump only for package codemirror-graphql

## 0.9.1-alpha.0 (2019-09-01)

**Note:** Version bump only for package codemirror-graphql

## 0.9.1 (2019-09-01)

**Note:** Version bump only for package codemirror-graphql
