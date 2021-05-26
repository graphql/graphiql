# graphql-language-service-interface

## 2.8.4

### Patch Changes

- [`5b8a057d`](https://github.com/graphql/graphiql/commit/5b8a057dd64ebecc391be32176a2403bb9d9ff92) [#1838](https://github.com/graphql/graphiql/pull/1838) Thanks [@acao](https://github.com/acao)! - Set all cross-runtime build targets to es6

## 2.8.3

### Patch Changes

- [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

## [2.8.2](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.8.1...graphql-language-service-interface@2.8.2) (2021-01-07)

**Note:** Version bump only for package graphql-language-service-interface

## [2.8.1](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.8.0...graphql-language-service-interface@2.8.1) (2021-01-07)

### Bug Fixes

- bug with externalFragments in codemirror ([#1751](https://github.com/graphql/graphiql/issues/1751)) ([f423e61](https://github.com/graphql/graphiql/commit/f423e615330bf8529f4068889d6760501b732527))

## [2.8.0](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.7.0...graphql-language-service-interface@2.8.0) (2021-01-07)

### Features

- implied or external fragments, for [#612](https://github.com/graphql/graphiql/issues/612) ([#1750](https://github.com/graphql/graphiql/issues/1750)) ([cfed265](https://github.com/graphql/graphiql/commit/cfed265e3cf31875b39ea517781a217fcdfcadc2))

## [2.7.0](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.6.0...graphql-language-service-interface@2.7.0) (2021-01-03)

### Features

- merge completion logic (for implements &, variables) ([#1747](https://github.com/graphql/graphiql/issues/1747)) ([0ac0a85](https://github.com/graphql/graphiql/commit/0ac0a856cfc715d7885a9965a9a9114ef2ca4b1a))

## [2.6.0](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.5.0...graphql-language-service-interface@2.6.0) (2020-12-28)

### Features

- interfaces implementing interfaces for the LSP ([#1742](https://github.com/graphql/graphiql/issues/1742)) ([c4cba85](https://github.com/graphql/graphiql/commit/c4cba85e869105f5363ebcb3826b4cf7b7e62c00))

## [2.5.0](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.3...graphql-language-service-interface@2.5.0) (2020-12-08)

### Bug Fixes

- dont use new deprecation rule yet ([8f0a4ac](https://github.com/graphql/graphiql/commit/8f0a4ac3331785994e4fe2d98637af0359314359))

### Features

- provide validation rules via props ([#1716](https://github.com/graphql/graphiql/issues/1716)) ([0c5785c](https://github.com/graphql/graphiql/commit/0c5785c82adbd4affb25300ae2d128b42c9b81fe))

## [2.4.3](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.2...graphql-language-service-interface@2.4.3) (2020-11-28)

### Bug Fixes

- remove assert module dependency ([2855dc5](https://github.com/graphql/graphiql/commit/2855dc513d03dd260607572e2fe76b22dcd16271))

## [2.4.2](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.2-alpha.2...graphql-language-service-interface@2.4.2) (2020-09-18)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.2-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.2-alpha.1...graphql-language-service-interface@2.4.2-alpha.2) (2020-09-11)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.2-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.2-alpha.0...graphql-language-service-interface@2.4.2-alpha.1) (2020-08-12)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.2-alpha.0](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.1...graphql-language-service-interface@2.4.2-alpha.0) (2020-08-10)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.1](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0...graphql-language-service-interface@2.4.1) (2020-08-06)

### Bug Fixes

- regression for variable def completion [#1622](https://github.com/graphql/graphiql/issues/1622) ([#1624](https://github.com/graphql/graphiql/issues/1624)) ([4f62a8f](https://github.com/graphql/graphiql/commit/4f62a8fd50d5a0357490c4e6a6a3016ef8972455))

## [2.4.0](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.11...graphql-language-service-interface@2.4.0) (2020-06-11)

### Bug Fixes

- highlightNode xxx in xxx syntax to revert back to simple dot notation for checking of existence ([#1566](https://github.com/graphql/graphiql/issues/1566)) ([cc7fbfe](https://github.com/graphql/graphiql/commit/cc7fbfe89d65943f23f58187c3fa3bdf0d4bbf1d))

## [2.4.0-alpha.11](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.10...graphql-language-service-interface@2.4.0-alpha.11) (2020-06-04)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.0-alpha.10](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.9...graphql-language-service-interface@2.4.0-alpha.10) (2020-06-04)

### Bug Fixes

- cleanup cache entry from lerna publish ([4a26218](https://github.com/graphql/graphiql/commit/4a2621808a1aea8b30d5d27b8d86a60bf2b44b01))

## [2.4.0-alpha.9](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.8...graphql-language-service-interface@2.4.0-alpha.9) (2020-05-28)

### Bug Fixes

- remove [@ts-nocheck](https://github.com/ts-nocheck) and fix type errors ([#1541](https://github.com/graphql/graphiql/issues/1541)) ([1bb7b0e](https://github.com/graphql/graphiql/commit/1bb7b0e7f8f265a52092bae4dd93809e78ba3b83))

## [2.4.0-alpha.8](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.7...graphql-language-service-interface@2.4.0-alpha.8) (2020-05-17)

### Bug Fixes

- remove problematic file resolution module from webpack sco… ([#1489](https://github.com/graphql/graphiql/issues/1489)) ([8dab038](https://github.com/graphql/graphiql/commit/8dab0385772f443f73b559e2c668080733168236))
- repair CLI, handle all schema and LSP errors ([#1482](https://github.com/graphql/graphiql/issues/1482)) ([992f384](https://github.com/graphql/graphiql/commit/992f38494f20f5877bfd6ff54893854ac7a0eaa2))

### Features

- introduce proper vscode completion kinds ([#1488](https://github.com/graphql/graphiql/issues/1488)) ([f19aa0d](https://github.com/graphql/graphiql/commit/f19aa0ddde6109526c101c8a487f43bbb8238394))
- Monaco Mode - Phase 2 - Mode & Worker ([#1459](https://github.com/graphql/graphiql/issues/1459)) ([bc95fb4](https://github.com/graphql/graphiql/commit/bc95fb46459a4437ff9471ff43c98e1c5c50f51e))
- monaco-graphql docs, api, improvements ([#1521](https://github.com/graphql/graphiql/issues/1521)) ([c79158c](https://github.com/graphql/graphiql/commit/c79158c72e976ab286e7ec3fded7f3e2d24e50d0))

## [2.4.0-alpha.7](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.6...graphql-language-service-interface@2.4.0-alpha.7) (2020-04-10)

### Bug Fixes

- graphiql@1.0.0-alpha.7 has broken reference to vscode types ([#1479](https://github.com/graphql/graphiql/issues/1479)) ([43e7056](https://github.com/graphql/graphiql/commit/43e705682fc258d50b167791469712a17a152cea))

## [2.4.0-alpha.6](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.5...graphql-language-service-interface@2.4.0-alpha.6) (2020-04-10)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.0-alpha.5](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.4...graphql-language-service-interface@2.4.0-alpha.5) (2020-04-06)

### Features

- export more functions ([#1264](https://github.com/graphql/graphiql/issues/1264)) ([bd01fdd](https://github.com/graphql/graphiql/commit/bd01fdd95fddb74b416213cdea17c1e1872ca513))
- upgrade to graphql@15.0.0 for [#1191](https://github.com/graphql/graphiql/issues/1191) ([#1204](https://github.com/graphql/graphiql/issues/1204)) ([f13c8e9](https://github.com/graphql/graphiql/commit/f13c8e9d0e66df4b051b332c7d02f4bb83e07ffd))

## [2.4.0-alpha.4](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.3...graphql-language-service-interface@2.4.0-alpha.4) (2020-04-03)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.0-alpha.3](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.2...graphql-language-service-interface@2.4.0-alpha.3) (2020-03-20)

**Note:** Version bump only for package graphql-language-service-interface

## [2.4.0-alpha.2](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.4.0-alpha.0...graphql-language-service-interface@2.4.0-alpha.2) (2020-03-20)

### Bug Fixes

- restore error handling for server [#1306](https://github.com/graphql/graphiql/issues/1306) ([#1425](https://github.com/graphql/graphiql/issues/1425)) ([c12d975](https://github.com/graphql/graphiql/commit/c12d975027e4021bbea7ad54e7e0c19ac7943e6c))

### Features

- Symbol support for single document ([#1244](https://github.com/graphql/graphiql/issues/1244)) ([f729f9a](https://github.com/graphql/graphiql/commit/f729f9a3c20362f4515bf3037347a07cc3690b38))
- use new GraphQL Config ([#1342](https://github.com/graphql/graphiql/issues/1342)) ([e45838f](https://github.com/graphql/graphiql/commit/e45838f5ba579e05b20f1a147ce431478ffad9aa))
- **definition:** get scalar definition ([21a0624](https://github.com/graphql/graphiql/commit/21a062422c8c96eefcd5acff7c3536562f836ba2))

## [2.4.0-alpha.1](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.3.3...graphql-language-service-interface@2.4.0-alpha.1) (2020-01-18)

### Features

- convert LSP Server to Typescript, remove watchman ([#1138](https://github.com/graphql/graphiql/issues/1138)) ([8e33dbb](https://github.com/graphql/graphiql/commit/8e33dbb))

## [2.3.3](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.3.2...graphql-language-service-interface@2.3.3) (2019-12-09)

### Bug Fixes

- test output, webpack resolution, clean build ([3b1c2c1](https://github.com/graphql/graphiql/commit/3b1c2c1))
- **gls-utils:** [#1055](https://github.com/graphql/graphiql/issues/1055) - move file test, refactor for fixtures ([19d8d7f](https://github.com/graphql/graphiql/commit/19d8d7f))

## [2.3.2](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.3.1...graphql-language-service-interface@2.3.2) (2019-12-03)

**Note:** Version bump only for package graphql-language-service-interface

## [2.3.1](https://github.com/graphql/graphiql/compare/graphql-language-service-interface@2.3.0...graphql-language-service-interface@2.3.1) (2019-11-26)

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

**Note:** Version bump only for package graphql-language-service-interface

## 2.1.1-alpha.0 (2019-09-01)

## 0.0.1 (2017-03-29)

**Note:** Version bump only for package graphql-language-service-interface

## 2.1.1 (2019-09-01)

## 0.0.1 (2017-03-29)

**Note:** Version bump only for package graphql-language-service-interface
