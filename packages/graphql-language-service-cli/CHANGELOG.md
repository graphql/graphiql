# graphql-language-service-cli

## 3.2.11

### Patch Changes

- Updated dependencies [[`e20760fb`](https://github.com/graphql/graphiql/commit/e20760fbd95c13d6d549cba3faa15a59aee9a2c0)]:
  - graphql-language-service@4.1.2
  - graphql-language-service-server@2.7.11

## 3.2.10

### Patch Changes

- Updated dependencies [[`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63)]:
  - graphql-language-service-server@2.7.10
  - graphql-language-service-utils@2.7.1
  - graphql-language-service@4.1.1

## 3.2.9

### Patch Changes

- Updated dependencies [[`0f1f90ce`](https://github.com/graphql/graphiql/commit/0f1f90ce8f4a25ddebdaf7a9ddbe136214aa64a3)]:
  - graphql-language-service@4.1.0
  - graphql-language-service-server@2.7.9

## 3.2.8

### Patch Changes

- Updated dependencies [[`9df315b4`](https://github.com/graphql/graphiql/commit/9df315b44896efa313ed6744445fc8f9e702ebc3)]:
  - graphql-language-service-utils@2.7.0
  - graphql-language-service@4.0.0
  - graphql-language-service-server@2.7.8

## 3.2.7

### Patch Changes

- Updated dependencies [[`c4236190`](https://github.com/graphql/graphiql/commit/c4236190f91adedaf4f4a54cd0400a6b42c3c407), [`df57cd25`](https://github.com/graphql/graphiql/commit/df57cd2556302d6aa5dd140e7bee3f7bdab4deb1)]:
  - graphql-language-service-server@2.7.7
  - graphql-language-service@3.2.5

## 3.2.6

### Patch Changes

- Updated dependencies [[`4286185c`](https://github.com/graphql/graphiql/commit/4286185cdc6119175e23d66b8e177ba32693a63a)]:
  - graphql-language-service-server@2.7.6

## 3.2.5

### Patch Changes

- [`f82bd7a9`](https://github.com/graphql/graphiql/commit/f82bd7a931eb5fa9a33e59d417303706844c9063) [#2055](https://github.com/graphql/graphiql/pull/2055) Thanks [@acao](https://github.com/acao)! - this fixes the URI scheme related bugs and make sure schema as sdl config works again.

  `fileURLToPath` had been introduced by a contributor and I didnt test properly, it broke sdl file loading!

  definitions, autocomplete, diagnostics, etc should work again
  also hides the more verbose logging output for now

- Updated dependencies [[`f82bd7a9`](https://github.com/graphql/graphiql/commit/f82bd7a931eb5fa9a33e59d417303706844c9063)]:
  - graphql-language-service-server@2.7.5
  - graphql-language-service@3.2.4
  - graphql-language-service-utils@2.6.3

## 3.2.4

### Patch Changes

- [`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf) [#2047](https://github.com/graphql/graphiql/pull/2047) Thanks [@willstott101](https://github.com/willstott101)! - Source code included in all packages to fix source maps. codemirror-graphql includes esm build in package.

- Updated dependencies [[`bdd57312`](https://github.com/graphql/graphiql/commit/bdd573129844168749aba0aaa20e31b9da81aacf)]:
  - graphql-language-service@3.2.3
  - graphql-language-service-server@2.7.4
  - graphql-language-service-utils@2.6.2

## 3.2.3

### Patch Changes

- Updated dependencies [[`858907d2`](https://github.com/graphql/graphiql/commit/858907d2106742a65ec52eb017f2e91268cc37bf)]:
  - graphql-language-service@3.2.2
  - graphql-language-service-server@2.7.3
  - graphql-language-service-utils@2.6.1

## 3.2.2

### Patch Changes

- Updated dependencies [[`7e98c6ff`](https://github.com/graphql/graphiql/commit/7e98c6fff3b1c62954c9c8d902ac64ddbf23fc5d)]:
  - graphql-language-service-server@2.7.2

## 3.2.1

### Patch Changes

- [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce) [#2013](https://github.com/graphql/graphiql/pull/2013) Thanks [@PabloSzx](https://github.com/PabloSzx)! - Update utils

- Updated dependencies [[`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce), [`9a6ed03f`](https://github.com/graphql/graphiql/commit/9a6ed03fbe4de9652ff5d81a8f584234995dd2ce)]:
  - graphql-language-service-utils@2.6.0
  - graphql-language-service@3.2.1
  - graphql-language-service-server@2.7.1

## 3.2.0

### Minor Changes

- [`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a) [#2010](https://github.com/graphql/graphiql/pull/2010) Thanks [@acao](https://github.com/acao)! - upgrade to `graphql@16.0.0-experimental-stream-defer.5`. thanks @saihaj!

### Patch Changes

- Updated dependencies [[`716cf786`](https://github.com/graphql/graphiql/commit/716cf786aea6af42ea637ca3c56ae6c6ebc17c7a)]:
  - graphql-language-service-server@2.7.0
  - graphql-language-service@3.2.0

## 3.1.14

### Patch Changes

- [`83c4a007`](https://github.com/graphql/graphiql/commit/83c4a0070a4df704ce874ec977d65ca6c7e43ee8) [#1964](https://github.com/graphql/graphiql/pull/1964) Thanks [@patrickszmucer](https://github.com/patrickszmucer)! - Fix unknown fragment errors on save

* [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8) [#1777](https://github.com/graphql/graphiql/pull/1777) Thanks [@dwwoelfel](https://github.com/dwwoelfel)! - adopt block string parsing for variables in language parser

* Updated dependencies [[`0e2c1a02`](https://github.com/graphql/graphiql/commit/0e2c1a020cc2761155f7c9467d3ed4cb45941aeb), [`83c4a007`](https://github.com/graphql/graphiql/commit/83c4a0070a4df704ce874ec977d65ca6c7e43ee8), [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8)]:
  - graphql-language-service@3.1.6
  - graphql-language-service-server@2.6.5

## 3.1.13

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

## [3.1.12](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.11...graphql-language-service-cli@3.1.12) (2021-01-07)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.11](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.10...graphql-language-service-cli@3.1.11) (2021-01-07)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.10](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.9...graphql-language-service-cli@3.1.10) (2021-01-07)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.9](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.8...graphql-language-service-cli@3.1.9) (2021-01-03)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.8](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.7...graphql-language-service-cli@3.1.8) (2020-12-28)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.7](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.6...graphql-language-service-cli@3.1.7) (2020-12-08)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.6](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.5...graphql-language-service-cli@3.1.6) (2020-11-28)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.5](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.4...graphql-language-service-cli@3.1.5) (2020-10-20)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.4](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.3...graphql-language-service-cli@3.1.4) (2020-09-23)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.3](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.2...graphql-language-service-cli@3.1.3) (2020-09-23)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.2](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.1...graphql-language-service-cli@3.1.2) (2020-09-20)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.1](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.0...graphql-language-service-cli@3.1.1) (2020-09-20)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.0](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.0-alpha.5...graphql-language-service-cli@3.1.0) (2020-09-18)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.0-alpha.5](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.0-alpha.4...graphql-language-service-cli@3.1.0-alpha.5) (2020-09-11)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.0-alpha.3...graphql-language-service-cli@3.1.0-alpha.4) (2020-08-26)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.0-alpha.2...graphql-language-service-cli@3.1.0-alpha.3) (2020-08-22)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.0-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.0-alpha.1...graphql-language-service-cli@3.1.0-alpha.2) (2020-08-12)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.0-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.1.0-alpha.0...graphql-language-service-cli@3.1.0-alpha.1) (2020-08-12)

**Note:** Version bump only for package graphql-language-service-cli

## [3.1.0-alpha.0](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.0.1...graphql-language-service-cli@3.1.0-alpha.0) (2020-08-10)

### Bug Fixes

- pre-cacheing schema bugs, new server config options ([#1636](https://github.com/graphql/graphiql/issues/1636)) ([d989456](https://github.com/graphql/graphiql/commit/d9894564c056134e15093956e0951dcefe061d76))

### Features

- graphql-config@3 support in lsp server ([#1616](https://github.com/graphql/graphiql/issues/1616)) ([27cd185](https://github.com/graphql/graphiql/commit/27cd18562b64dfe18e6343b6a49f3f606af89d86))

## [3.0.1](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.0.0...graphql-language-service-cli@3.0.1) (2020-08-06)

**Note:** Version bump only for package graphql-language-service-cli

## [3.0.0](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.0.0-alpha.5...graphql-language-service-cli@3.0.0) (2020-06-11)

**Note:** Version bump only for package graphql-language-service-cli

## [3.0.0-alpha.5](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.0.0-alpha.4...graphql-language-service-cli@3.0.0-alpha.5) (2020-06-04)

**Note:** Version bump only for package graphql-language-service-cli

## [3.0.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.0.0-alpha.3...graphql-language-service-cli@3.0.0-alpha.4) (2020-06-04)

### Bug Fixes

- cleanup cache entry from lerna publish ([4a26218](https://github.com/graphql/graphiql/commit/4a2621808a1aea8b30d5d27b8d86a60bf2b44b01))

## [3.0.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service-cli@3.0.0-alpha.2...graphql-language-service-cli@3.0.0-alpha.3) (2020-05-28)

**Note:** Version bump only for package graphql-language-service-cli

# 3.0.0-alpha.2 (2020-05-19)

**Note:** Version bump only for package graphql-language-service-cli

## [2.4.0-alpha.8](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.7...graphql-language-service@2.4.0-alpha.8) (2020-05-17)

### Bug Fixes

- repair CLI, handle all schema and LSP errors ([#1482](https://github.com/graphql/graphiql/issues/1482)) ([992f384](https://github.com/graphql/graphiql/commit/992f38494f20f5877bfd6ff54893854ac7a0eaa2))

## [2.4.0-alpha.7](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.6...graphql-language-service@2.4.0-alpha.7) (2020-04-10)

**Note:** Version bump only for package graphql-language-service

## [2.4.0-alpha.6](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.5...graphql-language-service@2.4.0-alpha.6) (2020-04-10)

**Note:** Version bump only for package graphql-language-service

## [2.4.0-alpha.5](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.4...graphql-language-service@2.4.0-alpha.5) (2020-04-06)

### Features

- upgrade to graphql@15.0.0 for [#1191](https://github.com/graphql/graphiql/issues/1191) ([#1204](https://github.com/graphql/graphiql/issues/1204)) ([f13c8e9](https://github.com/graphql/graphiql/commit/f13c8e9d0e66df4b051b332c7d02f4bb83e07ffd))

## [2.4.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.3...graphql-language-service@2.4.0-alpha.4) (2020-04-03)

**Note:** Version bump only for package graphql-language-service

## [2.4.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.2...graphql-language-service@2.4.0-alpha.3) (2020-03-20)

**Note:** Version bump only for package graphql-language-service

## [2.4.0-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service@2.4.0-alpha.0...graphql-language-service@2.4.0-alpha.2) (2020-03-20)

### Bug Fixes

- error formatting, [#1319](https://github.com/graphql/graphiql/issues/1319) ([#1381](https://github.com/graphql/graphiql/issues/1381)) ([16509a4](https://github.com/graphql/graphiql/commit/16509a4278d523a7f0a96c846cc0f370d29a0700))

### Features

- **cli:** recommend matching commmands ([#1420](https://github.com/graphql/graphiql/issues/1420)) ([0fbae82](https://github.com/graphql/graphiql/commit/0fbae828ced2e8b95016268805654cde8322b076))
- **graphql-config:** add graphql config extensions ([#1118](https://github.com/graphql/graphiql/issues/1118)) ([2a77e47](https://github.com/graphql/graphiql/commit/2a77e47719ec9181a00183a08ffa11287b8fd2f5))
- capture unknown commands making use of the inhouse s… ([#1417](https://github.com/graphql/graphiql/issues/1417)) ([dd12a6b](https://github.com/graphql/graphiql/commit/dd12a6b903976ce8d35cf91d3c9606450f1c0990))
- use new GraphQL Config ([#1342](https://github.com/graphql/graphiql/issues/1342)) ([e45838f](https://github.com/graphql/graphiql/commit/e45838f5ba579e05b20f1a147ce431478ffad9aa))

## [2.4.0-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service@2.3.4...graphql-language-service@2.4.0-alpha.1) (2020-01-18)

### Features

- convert LSP Server to Typescript, remove watchman ([#1138](https://github.com/graphql/graphiql/issues/1138)) ([8e33dbb](https://github.com/graphql/graphiql/commit/8e33dbb))

## [2.3.4](https://github.com/graphql/graphiql/compare/graphql-language-service@2.3.3...graphql-language-service@2.3.4) (2019-12-09)

**Note:** Version bump only for package graphql-language-service

## [2.3.3](https://github.com/graphql/graphiql/compare/graphql-language-service@2.3.2...graphql-language-service@2.3.3) (2019-12-09)

**Note:** Version bump only for package graphql-language-service

## [2.3.2](https://github.com/graphql/graphiql/compare/graphql-language-service@2.3.1...graphql-language-service@2.3.2) (2019-12-03)

**Note:** Version bump only for package graphql-language-service

## [2.3.1](https://github.com/graphql/graphiql/compare/graphql-language-service@2.3.0...graphql-language-service@2.3.1) (2019-11-26)

**Note:** Version bump only for package graphql-language-service

# 2.3.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 2.0.1 (2019-05-14)

# 2.0.0 (2018-09-18)

## 1.2.2 (2018-06-11)

## 1.1.2 (2018-04-19)

## 1.1.1 (2018-04-18)

# 1.1.0 (2018-04-09)

## 1.0.18 (2018-01-04)

## 1.0.16 (2017-11-21)

## 1.0.15 (2017-10-02)

## 0.1.14 (2017-09-29)

## 0.1.13 (2017-08-24)

## 0.1.12 (2017-08-21)

## 0.1.11 (2017-08-20)

## 0.1.10 (2017-08-19)

## 0.1.9 (2017-08-18)

## 0.1.8 (2017-08-18)

## 0.1.7 (2017-08-16)

## 0.1.6 (2017-08-15)

## 0.1.5 (2017-08-14)

## 0.1.5-0 (2017-08-10)

## 0.1.4-0 (2017-08-10)

## 0.1.3-0 (2017-08-10)

## 0.1.2-0 (2017-08-10)

## 0.1.1-0 (2017-08-10)

# 0.1.0-0 (2017-08-10)

# 2.2.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 2.0.1 (2019-05-14)

# 2.0.0 (2018-09-18)

## 1.2.2 (2018-06-11)

## 1.1.2 (2018-04-19)

## 1.1.1 (2018-04-18)

# 1.1.0 (2018-04-09)

## 1.0.18 (2018-01-04)

## 1.0.16 (2017-11-21)

## 1.0.15 (2017-10-02)

## 0.1.14 (2017-09-29)

## 0.1.13 (2017-08-24)

## 0.1.12 (2017-08-21)

## 0.1.11 (2017-08-20)

## 0.1.10 (2017-08-19)

## 0.1.9 (2017-08-18)

## 0.1.8 (2017-08-18)

## 0.1.7 (2017-08-16)

## 0.1.6 (2017-08-15)

## 0.1.5 (2017-08-14)

## 0.1.5-0 (2017-08-10)

## 0.1.4-0 (2017-08-10)

## 0.1.3-0 (2017-08-10)

## 0.1.2-0 (2017-08-10)

## 0.1.1-0 (2017-08-10)

# 0.1.0-0 (2017-08-10)

# 2.2.0-alpha.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 2.0.1 (2019-05-14)

# 2.0.0 (2018-09-18)

## 1.2.2 (2018-06-11)

## 1.1.2 (2018-04-19)

## 1.1.1 (2018-04-18)

# 1.1.0 (2018-04-09)

## 1.0.18 (2018-01-04)

## 1.0.16 (2017-11-21)

## 1.0.15 (2017-10-02)

## 0.1.14 (2017-09-29)

## 0.1.13 (2017-08-24)

## 0.1.12 (2017-08-21)

## 0.1.11 (2017-08-20)

## 0.1.10 (2017-08-19)

## 0.1.9 (2017-08-18)

## 0.1.8 (2017-08-18)

## 0.1.7 (2017-08-16)

## 0.1.6 (2017-08-15)

## 0.1.5 (2017-08-14)

## 0.1.5-0 (2017-08-10)

## 0.1.4-0 (2017-08-10)

## 0.1.3-0 (2017-08-10)

## 0.1.2-0 (2017-08-10)

## 0.1.1-0 (2017-08-10)

# 0.1.0-0 (2017-08-10)

## 2.1.1-alpha.1 (2019-09-01)

## 2.0.1 (2019-05-14)

# 2.0.0 (2018-09-18)

## 1.2.2 (2018-06-11)

## 1.1.2 (2018-04-19)

## 1.1.1 (2018-04-18)

# 1.1.0 (2018-04-09)

## 1.0.18 (2018-01-04)

## 1.0.16 (2017-11-21)

## 1.0.15 (2017-10-02)

## 0.1.14 (2017-09-29)

## 0.1.13 (2017-08-24)

## 0.1.12 (2017-08-21)

## 0.1.11 (2017-08-20)

## 0.1.10 (2017-08-19)

## 0.1.9 (2017-08-18)

## 0.1.8 (2017-08-18)

## 0.1.7 (2017-08-16)

## 0.1.6 (2017-08-15)

## 0.1.5 (2017-08-14)

## 0.1.5-0 (2017-08-10)

## 0.1.4-0 (2017-08-10)

## 0.1.3-0 (2017-08-10)

## 0.1.2-0 (2017-08-10)

## 0.1.1-0 (2017-08-10)

# 0.1.0-0 (2017-08-10)

**Note:** Version bump only for package graphql-language-service

## 2.1.1-alpha.0 (2019-09-01)

## 2.0.1 (2019-05-14)

# 2.0.0 (2018-09-18)

## 1.2.2 (2018-06-11)

## 1.1.2 (2018-04-19)

## 1.1.1 (2018-04-18)

# 1.1.0 (2018-04-09)

## 1.0.18 (2018-01-04)

## 1.0.16 (2017-11-21)

## 1.0.15 (2017-10-02)

## 0.1.14 (2017-09-29)

## 0.1.13 (2017-08-24)

## 0.1.12 (2017-08-21)

## 0.1.11 (2017-08-20)

## 0.1.10 (2017-08-19)

## 0.1.9 (2017-08-18)

## 0.1.8 (2017-08-18)

## 0.1.7 (2017-08-16)

## 0.1.6 (2017-08-15)

## 0.1.5 (2017-08-14)

## 0.1.5-0 (2017-08-10)

## 0.1.4-0 (2017-08-10)

## 0.1.3-0 (2017-08-10)

## 0.1.2-0 (2017-08-10)

## 0.1.1-0 (2017-08-10)

# 0.1.0-0 (2017-08-10)

**Note:** Version bump only for package graphql-language-service

## 2.1.1 (2019-09-01)

## 2.0.1 (2019-05-14)

# 2.0.0 (2018-09-18)

## 1.2.2 (2018-06-11)

## 1.1.2 (2018-04-19)

## 1.1.1 (2018-04-18)

# 1.1.0 (2018-04-09)

## 1.0.18 (2018-01-04)

## 1.0.16 (2017-11-21)

## 1.0.15 (2017-10-02)

## 0.1.14 (2017-09-29)

## 0.1.13 (2017-08-24)

## 0.1.12 (2017-08-21)

## 0.1.11 (2017-08-20)

## 0.1.10 (2017-08-19)

## 0.1.9 (2017-08-18)

## 0.1.8 (2017-08-18)

## 0.1.7 (2017-08-16)

## 0.1.6 (2017-08-15)

## 0.1.5 (2017-08-14)

## 0.1.5-0 (2017-08-10)

## 0.1.4-0 (2017-08-10)

## 0.1.3-0 (2017-08-10)

## 0.1.2-0 (2017-08-10)

## 0.1.1-0 (2017-08-10)

# 0.1.0-0 (2017-08-10)

**Note:** Version bump only for package graphql-language-service
