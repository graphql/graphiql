# Change Log

## 1.4.7

### Patch Changes

- [`130ddad6`](https://github.com/graphql/graphiql/commit/130ddad6d0394356ec32070a6fee1840450a4660) Thanks [@acao](https://github.com/acao)! - **CRITICAL SECURITY PATCH** for the [GraphiQL introspection schema template injection attack](https://github.com/graphql/graphiql/security/advisories/GHSA-x4r7-m2q9-69c8)

## 1.4.6

### Patch Changes

- [`d3a88283`](https://github.com/graphql/graphiql/commit/d3a88283c7b618376ad4a06c7db20e60b066d1a0) [#1934](https://github.com/graphql/graphiql/pull/1934) Thanks [@tonyfromundefined](https://github.com/tonyfromundefined)! - add react 17, 18 in peerDependencies

* [`afaa36c1`](https://github.com/graphql/graphiql/commit/afaa36c198648e84f305986a0b1dfefa97e70221) [#1883](https://github.com/graphql/graphiql/pull/1883) Thanks [@Sweetabix1](https://github.com/Sweetabix1)! - Updating font colors for line numbers, comments & brackets from #999 to #666 for accessibility purposes. #666 passes AA accessibility standards for small text, with a contrast ratio of over 5:1.

- [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8) [#1777](https://github.com/graphql/graphiql/pull/1777) Thanks [@dwwoelfel](https://github.com/dwwoelfel)! - adopt block string parsing for variables in language parser

- Updated dependencies [[`0e2c1a02`](https://github.com/graphql/graphiql/commit/0e2c1a020cc2761155f7c9467d3ed4cb45941aeb), [`75dbb0b1`](https://github.com/graphql/graphiql/commit/75dbb0b18e2102d271a5cfe78faf54fe22e83ac8)]:
  - graphql-language-service@3.1.6
  - codemirror-graphql@1.0.3

## 1.4.5

### Patch Changes

- [`86795d5f`](https://github.com/graphql/graphiql/commit/86795d5ffa2d3e6c8aee74f761d02f054b428d46) Thanks [@acao](https://github.com/acao)! - Remove bad type definition from `subscriptions-transport-ws` #1992 closes #1989

- Updated dependencies [[`86795d5f`](https://github.com/graphql/graphiql/commit/86795d5ffa2d3e6c8aee74f761d02f054b428d46)]:
  - @graphiql/toolkit@0.3.2

## 1.4.4

### Patch Changes

- [`62e786b5`](https://github.com/graphql/graphiql/commit/62e786b57cc5748eccac59814dfc8ecd0104c748) [#1990](https://github.com/graphql/graphiql/pull/1990) Thanks [@acao](https://github.com/acao)! - Remove type definition from `subscriptions-transport-ws`

- Updated dependencies [[`62e786b5`](https://github.com/graphql/graphiql/commit/62e786b57cc5748eccac59814dfc8ecd0104c748)]:
  - @graphiql/toolkit@0.3.1

## 1.4.3

### Patch Changes

- [`6a459f4c`](https://github.com/graphql/graphiql/commit/6a459f4c235bb0d70725ae6ad7fc1cfa34f49dca) [#1968](https://github.com/graphql/graphiql/pull/1968) Thanks [@acao](https://github.com/acao)! - Remove `optionalDependencies` entirely, remove `subscriptions-transport-ws` which introduces vulnerabilities, upgrade `@n1ru4l/push-pull-async-iterable-iterator` to 3.0.0, upgrade `graphql-ws` several minor versions - the `graphql-ws@5.x` upgrade will come in a later minor release.

* [`eb2d91fa`](https://github.com/graphql/graphiql/commit/eb2d91fa8e4a03cb5663f27f724db2c95989a40f) [#1914](https://github.com/graphql/graphiql/pull/1914) Thanks [@harshithpabbati](https://github.com/harshithpabbati)! - fix: history can now be saved even when query history panel is not opened
  feat: create a new maxHistoryLength prop to allow more than 20 queries in history panel

- [`04fad79c`](https://github.com/graphql/graphiql/commit/04fad79c094318d4b4c9e0250c5cff55d9fc5116) [#1889](https://github.com/graphql/graphiql/pull/1889) Thanks [@henryqdineen](https://github.com/henryqdineen)! - feat: export ToolbarSelectOption and ToolbarMenuItem

* [`cd685435`](https://github.com/graphql/graphiql/commit/cd6854352ac6beff57af76db7de38e8157ff13aa) [#1923](https://github.com/graphql/graphiql/pull/1923) Thanks [@cgarnier](https://github.com/cgarnier)! - Fix result window theme

* Updated dependencies [[`6a459f4c`](https://github.com/graphql/graphiql/commit/6a459f4c235bb0d70725ae6ad7fc1cfa34f49dca), [`2fd5bf72`](https://github.com/graphql/graphiql/commit/2fd5bf7239edb78339e5ac7211f09c245e47c3bb)]:
  - @graphiql/toolkit@0.3.0
  - graphql-language-service@3.1.5

## 1.4.2

### Patch Changes

- [`5b8a057d`](https://github.com/graphql/graphiql/commit/5b8a057dd64ebecc391be32176a2403bb9d9ff92) [#1838](https://github.com/graphql/graphiql/pull/1838) Thanks [@acao](https://github.com/acao)! - Set all cross-runtime build targets to es6

## 1.4.1

### Patch Changes

- [`9f8c78ce`](https://github.com/graphql/graphiql/commit/9f8c78ce8c72a9dcf35b3e82bd3129ac17d845e6) [#1821](https://github.com/graphql/graphiql/pull/1821) Thanks [@harshithpabbati](https://github.com/harshithpabbati)! - fix: render query history panel only when it's toggled, instead of hiding with CSS

* [`dd9397e4`](https://github.com/graphql/graphiql/commit/dd9397e4c693b5ceadbd26d6fa92aa6246aac9c3) [#1819](https://github.com/graphql/graphiql/pull/1819) Thanks [@acao](https://github.com/acao)! - `GraphiQL.createClient()` accepts custom `legacyClient`, exports typescript types, fixes #1800.

  `createGraphiQLFetcher` now only attempts an `graphql-ws` connection when only `subscriptionUrl` is provided. In order to use `graphql-transport-ws`, you'll need to provide the `legacyClient` option only, and no `subscriptionUrl` or `wsClient` option.

- [`1f92d1dc`](https://github.com/graphql/graphiql/commit/1f92d1dcc0102bdec078263b87ca20cd670a1c86) [#1804](https://github.com/graphql/graphiql/pull/1804) Thanks [@maraisr](https://github.com/maraisr)! - Fixes issue where with IncrementalDelivery directives objects wouldn't deep-merge.

* [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a) [#1816](https://github.com/graphql/graphiql/pull/1816) Thanks [@acao](https://github.com/acao)! - improve peer resolutions for graphql 14 & 15. `14.5.0` minimum is for built-in typescript types, and another method only available in `14.4.0`

* Updated dependencies [[`dd9397e4`](https://github.com/graphql/graphiql/commit/dd9397e4c693b5ceadbd26d6fa92aa6246aac9c3), [`6869ce77`](https://github.com/graphql/graphiql/commit/6869ce7767050787db5f1017abf82fa5a52fc97a)]:
  - @graphiql/toolkit@0.2.0

## 1.4.0

### Patch Changes

- Updated dependencies [[`b4fc16c0`](https://github.com/graphql/graphiql/commit/b4fc16c025da6f466727dc17cab6026d14c6e7fe)]:
  - codemirror-graphql@1.0.0

## 1.4.0

### Bugfixes

- Fixes the search icon misalignment. (#1776) by [@iifawzi](https://github.com/iifawzi)
- run `onToggleDocs` when setting `docExplorerOpen` to false (#1768) by [@ChiragKasat](https://github.com/ChiragKasat)

### Minor Changes

- 1c119386: `@defer`, `@stream`, and `graphql-ws` support in a `createGraphiQLFetcher` utility (#1770)

  - support for `@defer` and `@stream` in `GraphiQL` itself on fetcher execution and when handling stream payloads
  - introduce `@graphiql/toolkit` for types and utilities used to compose `GraphiQL` and other related libraries
  - introduce `@graphiql/create-fetcher` to accept simplified parameters to generate a `fetcher` that covers the most commonly used `graphql-over-http` transport spec proposals. using `meros` for multipart http, and `graphql-ws` for websockets subscriptions.
  - use `graphql` and `graphql-express` `experimental-defer-stream` branch in development until it's merged
  - add cypress e2e tests for `@stream` in different scenarios
  - add some unit tests for `createGraphiQLFetcher`

### Patch Changes

- Updated dependencies [1c119386]
  - @graphiql/create-fetcher@0.1.0
  - @graphiql/toolkit@0.1.0

## [1.3.2](https://github.com/graphql/graphiql/compare/graphiql@1.3.1...graphiql@1.3.2) (2021-01-07)

**Note:** Version bump only for package graphiql

## [1.3.1](https://github.com/graphql/graphiql/compare/graphiql@1.3.0...graphiql@1.3.1) (2021-01-07)

**Note:** Version bump only for package graphiql

## [1.3.0](https://github.com/graphql/graphiql/compare/graphiql@1.2.2...graphiql@1.3.0) (2021-01-07)

### Features

- also support fetcher functions that return Promise<Observable> or Promise ([#1739](https://github.com/graphql/graphiql/issues/1739)) ([a804f3c](https://github.com/graphql/graphiql/commit/a804f3c011e7cafb4f8a48a1ba101b875be3540d))
- implied or external fragments, for [#612](https://github.com/graphql/graphiql/issues/612) ([#1750](https://github.com/graphql/graphiql/issues/1750)) ([cfed265](https://github.com/graphql/graphiql/commit/cfed265e3cf31875b39ea517781a217fcdfcadc2))

## [1.2.2](https://github.com/graphql/graphiql/compare/graphiql@1.2.1...graphiql@1.2.2) (2021-01-03)

**Note:** Version bump only for package graphiql

## [1.2.1](https://github.com/graphql/graphiql/compare/graphiql@1.2.0...graphiql@1.2.1) (2020-12-28)

### Bug Fixes

- display schema description if available ([050c506](https://github.com/graphql/graphiql/commit/050c506ed4ed2852bf9a5b099f967928d9856156))
- fix linting issue ([7117b7c](https://github.com/graphql/graphiql/commit/7117b7ccd2a2872e0051c8751252040d4042e190))

## [1.2.0](https://github.com/graphql/graphiql/compare/graphiql@1.1.0...graphiql@1.2.0) (2020-12-08)

### Features

- add AsyncIterable support to fetcher function ([#1724](https://github.com/graphql/graphiql/issues/1724)) ([a568af3](https://github.com/graphql/graphiql/commit/a568af3674404b8a15055792c2c35128b2bd711c))
- provide validation rules via props ([#1716](https://github.com/graphql/graphiql/issues/1716)) ([0c5785c](https://github.com/graphql/graphiql/commit/0c5785c82adbd4affb25300ae2d128b42c9b81fe))

## [1.1.0](https://github.com/graphql/graphiql/compare/graphiql@1.0.6...graphiql@1.1.0) (2020-11-28)

### Bug Fixes

- improve props in GraphiQL readme ([b9b2c8d](https://github.com/graphql/graphiql/commit/b9b2c8d8bde6064a4cdcb01911b024602fcdbe9f))

### Features

- **graphiql:** add prop for adding toolbar content while preserving the default buttons ([ea81056](https://github.com/graphql/graphiql/commit/ea81056e09b0a95e1536c79fab27e027739808c4))
- deeper fragment merging ([238d0b5](https://github.com/graphql/graphiql/commit/238d0b5e52cfa9354757c9d52050692d152aae21))

## [1.0.6](https://github.com/graphql/graphiql/compare/graphiql@1.0.5...graphiql@1.0.6) (2020-10-20)

### Bug Fixes

- enable variable editor when header editor is not enabled ([#1682](https://github.com/graphql/graphiql/issues/1682)) ([205fbad](https://github.com/graphql/graphiql/commit/205fbad84806d175d66a6f5598e0a0f521129a16))

## [1.0.5](https://github.com/graphql/graphiql/compare/graphiql@1.0.4...graphiql@1.0.5) (2020-09-18)

**Note:** Version bump only for package graphiql

## [1.0.4](https://github.com/graphql/graphiql/compare/graphiql@2.0.0-alpha.5...graphiql@1.0.4) (2020-09-11)

### Bug Fixes

- dont use initial query on every re-render ([#1663](https://github.com/graphql/graphiql/issues/1663)) ([5aa890f](https://github.com/graphql/graphiql/commit/5aa890f6e145a7ad49f82cc122e209a291060709))

## [1.0.3](https://github.com/graphql/graphiql/compare/graphiql@1.0.2...graphiql@1.0.3) (2020-06-24)

### Bug Fixes

- headers tab - highlighting and schema fetch ([#1593](https://github.com/graphql/graphiql/issues/1593)) ([0d050ca](https://github.com/graphql/graphiql/commit/0d050caeb5278799f2b1c206d0c61f3ac768e7cd))

## [1.0.2](https://github.com/graphql/graphiql/compare/graphiql@1.0.1...graphiql@1.0.2) (2020-06-19)

**Note:** Version bump only for package graphiql

## [1.0.1](https://github.com/graphql/graphiql/compare/graphiql@1.0.0...graphiql@1.0.1) (2020-06-17)

### Bug Fixes

- more server side rendering fixes ([#1581](https://github.com/graphql/graphiql/issues/1581)) ([881a19f](https://github.com/graphql/graphiql/commit/881a19fbd5fbe5f65678de8074e593be7deb2ede)), closes [#1573](https://github.com/graphql/graphiql/issues/1573)
- network cancellation for 1.0 ([#1582](https://github.com/graphql/graphiql/issues/1582)) ([ad3cc0d](https://github.com/graphql/graphiql/commit/ad3cc0d1567ea49ff5677d4cd8524e5e072b605e))
- Set headers to localstorage ([#1578](https://github.com/graphql/graphiql/issues/1578)) ([cc7a7e2](https://github.com/graphql/graphiql/commit/cc7a7e2f6d25d7e8150dc89c6984e6a04b01566b))

## [1.0.0](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.13...graphiql@1.0.0) (2020-06-11)

### Bug Fixes

- call debounce statements as they are functions ([#1571](https://github.com/graphql/graphiql/issues/1571)) ([8541250](https://github.com/graphql/graphiql/commit/85412501307ccfffe258b7fbca74bb9309726a73))
- fix server side rendering by using type only codemirror import ([#1573](https://github.com/graphql/graphiql/issues/1573)) ([1ee60a6](https://github.com/graphql/graphiql/commit/1ee60a6db87d54c7a1e8f1089e52a65f335351b6)), closes [#118](https://github.com/graphql/graphiql/issues/118)
- Move all componentWillUnMount functionality to respective events ([#1544](https://github.com/graphql/graphiql/issues/1544)) ([046b09f](https://github.com/graphql/graphiql/commit/046b09f541e6a9f2ce4b46de590d49c04c916716))

## [1.0.0-alpha.13](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.12...graphiql@1.0.0-alpha.13) (2020-06-04)

**Note:** Version bump only for package graphiql

## [1.0.0-alpha.12](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.11...graphiql@1.0.0-alpha.12) (2020-06-04)

### Bug Fixes

- cleanup cache entry from lerna publish ([4a26218](https://github.com/graphql/graphiql/commit/4a2621808a1aea8b30d5d27b8d86a60bf2b44b01))
- display variable editor when headers are not enabled ([ce7b2e2](https://github.com/graphql/graphiql/commit/ce7b2e2b45d530b61e916112e864074cf3a6ddc7))

## [1.0.0-alpha.11](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.10...graphiql@1.0.0-alpha.11) (2020-05-28)

### Bug Fixes

- Safe setState ([#1547](https://github.com/graphql/graphiql/issues/1547)) ([f85969c](https://github.com/graphql/graphiql/commit/f85969c7e77e8fd269e026be36cc5065d6d33237))
- trigger edit variables on first render ([#1545](https://github.com/graphql/graphiql/issues/1545)) ([e54e1a8](https://github.com/graphql/graphiql/commit/e54e1a8691483f1d336231314130d9822481b3be))

### Features

- Add Headers Editor to GraphiQL ([#1543](https://github.com/graphql/graphiql/issues/1543)) ([3faa1ac](https://github.com/graphql/graphiql/commit/3faa1ac46514252e90abf2b2bda0841edf6115ea))

## [1.0.0-alpha.10](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.9...graphiql@1.0.0-alpha.10) (2020-05-19)

### Bug Fixes

- graphiql non-relative import issues ([#1534](https://github.com/graphql/graphiql/issues/1534)) fixes [#1530](https://github.com/graphql/graphiql/issues/1530) ([0ac9fa0](https://github.com/graphql/graphiql/commit/0ac9fa0a8dcdf8464c8ce31c487ebcfd6b9536a8))

## [1.0.0-alpha.9](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.8...graphiql@1.0.0-alpha.9) (2020-05-17)

### Bug Fixes

- remove problematic file resolution module from webpack sco… ([#1489](https://github.com/graphql/graphiql/issues/1489)) ([8dab038](https://github.com/graphql/graphiql/commit/8dab0385772f443f73b559e2c668080733168236))

### Features

- introduce proper vscode completion kinds ([#1488](https://github.com/graphql/graphiql/issues/1488)) ([f19aa0d](https://github.com/graphql/graphiql/commit/f19aa0ddde6109526c101c8a487f43bbb8238394))
- Monaco Mode - Phase 2 - Mode & Worker ([#1459](https://github.com/graphql/graphiql/issues/1459)) ([bc95fb4](https://github.com/graphql/graphiql/commit/bc95fb46459a4437ff9471ff43c98e1c5c50f51e))

## [1.0.0-alpha.8](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.7...graphiql@1.0.0-alpha.8) (2020-04-10)

**Note:** Version bump only for package graphiql

## [1.0.0-alpha.7](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.6...graphiql@1.0.0-alpha.7) (2020-04-10)

**Note:** Version bump only for package graphiql

## [1.0.0-alpha.6](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.5...graphiql@1.0.0-alpha.6) (2020-04-10)

**Note:** Version bump only for package graphiql

## [1.0.0-alpha.5](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.4...graphiql@1.0.0-alpha.5) (2020-04-06)

### Features

- upgrade to graphql@15.0.0 for [#1191](https://github.com/graphql/graphiql/issues/1191) ([#1204](https://github.com/graphql/graphiql/issues/1204)) ([f13c8e9](https://github.com/graphql/graphiql/commit/f13c8e9d0e66df4b051b332c7d02f4bb83e07ffd))

## [1.0.0-alpha.4](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.3...graphiql@1.0.0-alpha.4) (2020-04-03)

### Bug Fixes

- fix query argument missing from onEditQuery call ([#1440](https://github.com/graphql/graphiql/issues/1440)) ([6c335a8](https://github.com/graphql/graphiql/commit/6c335a813f6101afded00c0e869c337a7ca44020))

## [1.0.0-alpha.3](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.2...graphiql@1.0.0-alpha.3) (2020-03-20)

**Note:** Version bump only for package graphiql

## [1.0.0-alpha.2](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.0...graphiql@1.0.0-alpha.2) (2020-03-20)

### Bug Fixes

- Fix typo in documentation (comments) ([#1431](https://github.com/graphql/graphiql/issues/1431)) ([fdda8f0](https://github.com/graphql/graphiql/commit/fdda8f04479412d22e9a3e9215c7caa5369e7d83))
- initial request cache set, import tsc bugs ([#1266](https://github.com/graphql/graphiql/issues/1266)) ([6b98f8a](https://github.com/graphql/graphiql/commit/6b98f8a442d4a8ea160fb90a29acf33f5382db2e))

## [1.0.0-alpha.1](https://github.com/graphql/graphiql/compare/graphiql@0.17.5...graphiql@1.0.0-alpha.1) (2020-01-18)

### Bug Fixes

- hmr, file resolution warnings ([69bf701](https://github.com/graphql/graphiql/commit/69bf701))
- prefer displayName over type equality for children overrides ([e4cec0a](https://github.com/graphql/graphiql/commit/e4cec0a))
  - remove use of `findDOMNode` ([0b12323](https://github.com/graphql/graphiql/commit/0b12323)) by [@ryan-m-walker](https://github.com/ryan-m-walker)

### Features

- deprecate support for 15, support react 16 features ([#1107](https://github.com/graphql/graphiql/issues/1107)) ([bc4b6fc](https://github.com/graphql/graphiql/commit/bc4b6fc))
- **graphiql-theming:** Toolbar component ([#1203](https://github.com/graphql/graphiql/issues/1203)) by [@walaura](https://github.com/walaura) ([adb73f5](https://github.com/graphql/graphiql/commit/adb73f5))
- [new-ui] Tabs & Tabbars ([#1198](https://github.com/graphql/graphiql/issues/1198)) ([033f971](https://github.com/graphql/graphiql/commit/033f971)) by [@walaura](https://github.com/walaura)
- replace use of enzyme with react-testing-library ([#1144](https://github.com/graphql/graphiql/issues/1144)) by [@ryan-m-walker](https://github.com/ryan-m-walker) ([de73d6c](https://github.com/graphql/graphiql/commit/de73d6c))
- storybook+theme-ui for the new design ([#1145](https://github.com/graphql/graphiql/issues/1145)) ([7f97c0c](https://github.com/graphql/graphiql/commit/7f97c0c)) by [@walaura](https://github.com/walaura)

### BREAKING CHANGES

- Deprecate support for React 15. Please use React 16.8 or greater for hooks support.
  Co-authored-by: @ryan-m-walker, @acao
  Reviewed-by: @benjie

## [0.17.5](https://github.com/graphql/graphiql/compare/graphiql@0.17.4...graphiql@0.17.5) (2019-12-09)

**Note:** Version bump only for package graphiql

## [0.17.4](https://github.com/graphql/graphiql/compare/graphiql@0.17.3...graphiql@0.17.4) (2019-12-09)

### Bug Fixes

- graphiql babel test ignore paths ([e1588d9](https://github.com/graphql/graphiql/commit/e1588d9))

## [0.17.3](https://github.com/graphql/graphiql/compare/graphiql@0.17.2...graphiql@0.17.3) (2019-12-09)

### Bug Fixes

- express-graphql version ([e9848b0](https://github.com/graphql/graphiql/commit/e9848b0))
- test output, webpack resolution, clean build ([3b1c2c1](https://github.com/graphql/graphiql/commit/3b1c2c1))

## [0.17.2](https://github.com/graphql/graphiql/compare/graphiql@0.17.1...graphiql@0.17.2) (2019-12-03)

### Bug Fixes

- ensure css files move with babel dist ([ca95547](https://github.com/graphql/graphiql/commit/ca95547))
- remove css from downstream components. soon to be replaced w styled ([e765543](https://github.com/graphql/graphiql/commit/e765543))

## [0.17.1](https://github.com/graphql/graphiql/compare/graphiql@0.17.0...graphiql@0.17.1) (2019-12-03)

### Bug Fixes

- **graphiql:** duplicate query history key issue, fixes [#988](https://github.com/graphql/graphiql/issues/988) ([#1035](https://github.com/graphql/graphiql/issues/1035)) ([69c6826](https://github.com/graphql/graphiql/commit/69c6826))
- convert browserify build to webpack, fixes [#976](https://github.com/graphql/graphiql/issues/976) ([#1001](https://github.com/graphql/graphiql/issues/1001)) ([3caf041](https://github.com/graphql/graphiql/commit/3caf041))
- hints vertical scroll ([216eaeb](https://github.com/graphql/graphiql/commit/216eaeb))

## [0.17.0](https://github.com/graphql/graphiql/compare/graphiql@0.16.0...graphiql@0.17.0) (2019-11-26)

### Bug Fixes

- security bump, resolves [#1004](https://github.com/graphql/graphiql/issues/1004), SNYK-JS-MARKDOWNIT-459438 ([89c83db](https://github.com/graphql/graphiql/commit/89c83db))
- webpack resolutions for [#882](https://github.com/graphql/graphiql/issues/882), add webpack example ([ea9df3e](https://github.com/graphql/graphiql/commit/ea9df3e))

### Features

- **graphiql:** Prettify also formats query variables ([b7d0bfd](https://github.com/graphql/graphiql/commit/b7d0bfd))

## [0.16.0](https://github.com/graphql/graphiql/compare/graphiql@0.15.1...graphiql@0.16.0) (2019-10-19)

### Bug Fixes

- **accessibility:** improve accessibility of all components ([#967](https://github.com/graphql/graphiql/issues/967)) ([73a3f90](https://github.com/graphql/graphiql/commit/73a3f90))
- **css:** added minimum width for result panel in GraphiQL ([#980](https://github.com/graphql/graphiql/issues/980)) ([0c8b7ad](https://github.com/graphql/graphiql/commit/0c8b7ad))
- **graphiql:** better quota management ([#764](https://github.com/graphql/graphiql/issues/764)) ([7efed6c](https://github.com/graphql/graphiql/commit/7efed6c))

### Features

- **css:** beautify code tag in doc explorer ([#959](https://github.com/graphql/graphiql/issues/959)) resolves [#949](https://github.com/graphql/graphiql/issues/949) ([30810a2](https://github.com/graphql/graphiql/commit/30810a2))

### [0.15.1](https://github.com/graphql/graphiql/compare/graphiql@0.15.0...graphiql@0.15.1) (2019-10-04)

### Bug Fixes

- build tweaks ([0bc6a7c](https://github.com/graphql/graphiql/commit/0bc6a7c))

## 0.15.0 (2019-10-04)

### Bug Fixes

- check `window` is defined before using it ([#962](https://github.com/graphql/graphiql/issues/962)) ([e4866ad](https://github.com/graphql/graphiql/commit/e4866ad))
- **graphiql:** prettify keybinding bug for Firefox. Fixes [#905](https://github.com/graphql/graphiql/issues/905) ([fdf98ba](https://github.com/graphql/graphiql/commit/fdf98ba))
- check `this.editor` exist before `this.editor.off` in QueryEditor ([#669](https://github.com/graphql/graphiql/issues/669)) ([ca226ee](https://github.com/graphql/graphiql/commit/ca226ee)), closes [#665](https://github.com/graphql/graphiql/issues/665)
- extraKeys bugfix window regression ([f3d0427](https://github.com/graphql/graphiql/commit/f3d0427))
- preserve ctrl-f key for macOS ([7c381f9](https://github.com/graphql/graphiql/commit/7c381f9))

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.13.2 (2019-06-21)

## 0.14.3 (2019-09-01)

### Bug Fixes

- check `this.editor` exist before `this.editor.off` in QueryEditor ([#669](https://github.com/graphql/graphiql/issues/669)) ([ca226ee](https://github.com/graphql/graphiql/commit/ca226ee)), closes [#665](https://github.com/graphql/graphiql/issues/665)
- extraKeys bugfix window regression ([f3d0427](https://github.com/graphql/graphiql/commit/f3d0427))
- preserve ctrl-f key for macOS ([7c381f9](https://github.com/graphql/graphiql/commit/7c381f9))
- remove newline ([19f5d1d](https://github.com/graphql/graphiql/commit/19f5d1d))

## 0.13.2 (2019-06-21)

## 0.13.2 (2019-06-21)
