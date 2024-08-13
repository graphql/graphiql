# graphql-language-service

## 5.3.0

### Minor Changes

- [#3682](https://github.com/graphql/graphiql/pull/3682) [`6c9f0df`](https://github.com/graphql/graphiql/commit/6c9f0df83ea4afe7fa59f84d83d59fba73dc3931) Thanks [@yaacovCR](https://github.com/yaacovCR)! - Support v17 of `graphql-js` from `17.0.0-alpha.2` forward.

  Includes support for the latest incremental delivery response format. For further details, see https://github.com/graphql/defer-stream-wg/discussions/69.

## 5.2.2

### Patch Changes

- [#3637](https://github.com/graphql/graphiql/pull/3637) [`fdec377`](https://github.com/graphql/graphiql/commit/fdec377f28ac0d918a219b78dfa2d8f0996ff84d) Thanks [@dimaMachina](https://github.com/dimaMachina)! - update eslint plugins and fix errors

## 5.2.1

### Patch Changes

- [#3521](https://github.com/graphql/graphiql/pull/3521) [`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d) Thanks [@acao](https://github.com/acao)! - Fixes several issues with Type System (SDL) completion across the ecosystem:

  - restores completion for object and input type fields when the document context is not detectable or parseable
  - correct top-level completions for either of the unknown, type system or executable definitions. this leads to mixed top level completions when the document is unparseable, but now you are not seemingly restricted to only executable top level definitions
  - `.graphqls` ad-hoc standard functionality remains, but is not required, as it is not part of the official spec, and the spec also allows mixed mode documents in theory, and this concept is required when the type is unknown

## 5.2.0

### Minor Changes

- [#3376](https://github.com/graphql/graphiql/pull/3376) [`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c) Thanks [@bboure](https://github.com/bboure)! - Add support for custom scalars

### Patch Changes

- [#3376](https://github.com/graphql/graphiql/pull/3376) [`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c) Thanks [@bboure](https://github.com/bboure)! - Fix Variables JSON Schema for null values

## 5.1.7

### Patch Changes

- [#3224](https://github.com/graphql/graphiql/pull/3224) [`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9) Thanks [@acao](https://github.com/acao)! - try removing some packages from pre.json

- [#3149](https://github.com/graphql/graphiql/pull/3149) [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5) Thanks [@mskelton](https://github.com/mskelton)! - Fix hover docs being off by one position.

## 5.1.7-alpha.0

### Patch Changes

- [#3224](https://github.com/graphql/graphiql/pull/3224) [`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9) Thanks [@acao](https://github.com/acao)! - try removing some packages from pre.json

- [#3149](https://github.com/graphql/graphiql/pull/3149) [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5) Thanks [@mskelton](https://github.com/mskelton)! - Fix hover docs being off by one position.

## 5.1.6

### Patch Changes

- [#3148](https://github.com/graphql/graphiql/pull/3148) [`06007498`](https://github.com/graphql/graphiql/commit/06007498880528ed75dd4d705dcbcd7c9e775939) Thanks [@mskelton](https://github.com/mskelton)! - Use native LSP logger instead of manual file based logging. This fixes errors in Neovim when using the GraphQL LSP.

## 5.1.5

### Patch Changes

- [#3150](https://github.com/graphql/graphiql/pull/3150) [`4d33b221`](https://github.com/graphql/graphiql/commit/4d33b2214e941f171385a1b72a1fa995714bb284) Thanks [@AaronMoat](https://github.com/AaronMoat)! - fix(graphql-language-service-server): allow getDefinition to work for unions

  Fixes the issue where a schema like the one below won't allow you to click through to X.

  ```graphql
  union X = A | B
  type A {
    x: String
  }
  type B {
    x: String
  }
  type Query {
    a: X
  }
  ```

## 5.1.4

### Patch Changes

- [#3113](https://github.com/graphql/graphiql/pull/3113) [`2e477eb2`](https://github.com/graphql/graphiql/commit/2e477eb24672a242ae4a4f2dfaeaf41152ed7ee9) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `.forEach` with `for..of`

## 5.1.3

### Patch Changes

- [#3046](https://github.com/graphql/graphiql/pull/3046) [`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer .at() method for index access

- [#3042](https://github.com/graphql/graphiql/pull/3042) [`881a2024`](https://github.com/graphql/graphiql/commit/881a202497d5a58eb5260a5aa54c0c88930d69a0) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer String#slice() over String#substr() and String#substring()

## 5.1.2

### Patch Changes

- [#2986](https://github.com/graphql/graphiql/pull/2986) [`e68cb8bc`](https://github.com/graphql/graphiql/commit/e68cb8bcaf9baddf6fca747abab871ecd1bc7a4c) Thanks [@bboure](https://github.com/bboure)! - Fix JSON schema for custom scalars validation

- [#2917](https://github.com/graphql/graphiql/pull/2917) [`f788e65a`](https://github.com/graphql/graphiql/commit/f788e65aff267ec873237034831d1fd936222a9b) Thanks [@woodensail](https://github.com/woodensail)! - Fix infinite recursiveness in getVariablesJSONSchema when the schema contains types that reference themselves

- [#2993](https://github.com/graphql/graphiql/pull/2993) [`bdc966cb`](https://github.com/graphql/graphiql/commit/bdc966cba6134a72ff7fe40f76543c77ba15d4a4) Thanks [@B2o5T](https://github.com/B2o5T)! - add `unicorn/consistent-destructuring` rule

- [#2962](https://github.com/graphql/graphiql/pull/2962) [`db2a0982`](https://github.com/graphql/graphiql/commit/db2a0982a17134f0069483ab283594eb64735b7d) Thanks [@B2o5T](https://github.com/B2o5T)! - clean all ESLint warnings, add `--max-warnings=0` and `--cache` flags

- [#2940](https://github.com/graphql/graphiql/pull/2940) [`8725d1b6`](https://github.com/graphql/graphiql/commit/8725d1b6b686139286cf05dec6a84d89942128ba) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-node-protocol` rule

## 5.1.1

### Patch Changes

- [#2931](https://github.com/graphql/graphiql/pull/2931) [`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-negated-condition` and `no-else-return` rules

- [#2922](https://github.com/graphql/graphiql/pull/2922) [`d1fcad72`](https://github.com/graphql/graphiql/commit/d1fcad72607e2789517dfe4936b5ec604e46762b) Thanks [@B2o5T](https://github.com/B2o5T)! - extends `plugin:import/recommended` and fix warnings

- [#2941](https://github.com/graphql/graphiql/pull/2941) [`4a8b2e17`](https://github.com/graphql/graphiql/commit/4a8b2e1766a38eb4828cf9a81bf9d767070041de) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-logical-operator-over-ternary` rule

- [#2937](https://github.com/graphql/graphiql/pull/2937) [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-includes`

- [#2930](https://github.com/graphql/graphiql/pull/2930) [`c44ea4f1`](https://github.com/graphql/graphiql/commit/c44ea4f1917b97daac815c08299b934c8ca57ed9) Thanks [@B2o5T](https://github.com/B2o5T)! - remove `mapCat()` in favor of `Array#flatMap()`

- [#2965](https://github.com/graphql/graphiql/pull/2965) [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-optional-catch-binding` rule

- [#2936](https://github.com/graphql/graphiql/pull/2936) [`18f8e80a`](https://github.com/graphql/graphiql/commit/18f8e80ae12edfd0c36adcb300cf9e06ac27ea49) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `lonely-if`/`unicorn/lonely-if` rules

- [#2963](https://github.com/graphql/graphiql/pull/2963) [`f263f778`](https://github.com/graphql/graphiql/commit/f263f778cb95b9f413bd09ca56a43f5b9c2f6215) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `prefer-destructuring` rule

- [#2938](https://github.com/graphql/graphiql/pull/2938) [`6a9d913f`](https://github.com/graphql/graphiql/commit/6a9d913f0d1b847124286b3fa1f3a2649d315171) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/throw-new-error` rule

## 5.1.0

### Minor Changes

- [#2654](https://github.com/graphql/graphiql/pull/2654) [`d6ff4d7a`](https://github.com/graphql/graphiql/commit/d6ff4d7a5d535a0c43fe5914016bac9ef0c2b782) Thanks [@cshaver](https://github.com/cshaver)! - Provide autocomplete suggestions for documents with type definitions

## 5.0.6

### Patch Changes

- [#2506](https://github.com/graphql/graphiql/pull/2506) [`cccefa70`](https://github.com/graphql/graphiql/commit/cccefa70c0466d60e8496e1df61aeb1490af723c) Thanks [@acao](https://github.com/acao)! - Remove redundant check, trigger LSP release

## 5.0.5

### Patch Changes

- [#2486](https://github.com/graphql/graphiql/pull/2486) [`c9c51b8a`](https://github.com/graphql/graphiql/commit/c9c51b8a98e1f0427272d3e9ad60989b32f1a1aa) Thanks [@stonexer](https://github.com/stonexer)! - definition support for operation fields ✨

  you can now jump to the applicable object type definition for query/mutation/subscription fields!

## 5.0.4

### Patch Changes

- [#2378](https://github.com/graphql/graphiql/pull/2378) [`d22f6111`](https://github.com/graphql/graphiql/commit/d22f6111a60af25727d8dbc1058c79607df76af2) Thanks [@acao](https://github.com/acao)! - Trap all graphql parsing exceptions from (relatively) newly added logic. This should clear up bugs that have been plaguing users for two years now, sorry!

## 5.0.3

### Patch Changes

- [#2291](https://github.com/graphql/graphiql/pull/2291) [`45cbc759`](https://github.com/graphql/graphiql/commit/45cbc759c732999e8b1eb4714d6047ab77c17902) Thanks [@retrodaredevil](https://github.com/retrodaredevil)! - Target es6 for the languages services

## 5.0.2

### Patch Changes

- [`c36504a8`](https://github.com/graphql/graphiql/commit/c36504a804d8cc54a5136340152999b4a1a2c69f) Thanks [@acao](https://github.com/acao)! - - upgrade `graphql-config` to latest in server
  - remove `graphql-config` dependency from `vscode-graphql` and `graphql-language-service`
  - fix `vscode-graphql` esbuild bundling bug in `vscode-graphql` [#2269](https://github.com/graphql/graphiql/issues/2269) by fixing `esbuild` version

## 5.0.1

### Patch Changes

- [`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa) Thanks [@acao](https://github.com/acao)! - fix lockfile and imports from LSP merge

* [`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa) Thanks [@acao](https://github.com/acao)! - default to es6 target across the language services, fix #2240

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

- [#2103](https://github.com/graphql/graphiql/pull/2103) [`a44772d6`](https://github.com/graphql/graphiql/commit/a44772d6af97254c4f159ea7237e842a3e3719e8) Thanks [@acao](https://github.com/acao)! - LanguageService should not be imported by `codemirror-graphql`, and thus `picomatch` should not be imported.

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
