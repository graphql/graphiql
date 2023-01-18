# graphql-language-service-server

## 2.9.5

### Patch Changes

- [#2931](https://github.com/graphql/graphiql/pull/2931) [`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-negated-condition` and `no-else-return` rules

- [#2922](https://github.com/graphql/graphiql/pull/2922) [`d1fcad72`](https://github.com/graphql/graphiql/commit/d1fcad72607e2789517dfe4936b5ec604e46762b) Thanks [@B2o5T](https://github.com/B2o5T)! - extends `plugin:import/recommended` and fix warnings

- [#2966](https://github.com/graphql/graphiql/pull/2966) [`f9aa87dc`](https://github.com/graphql/graphiql/commit/f9aa87dc6a88ed8a8a0a94de520c7a41fff8ffde) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `sonarjs/no-small-switch` and `sonarjs/no-duplicated-branches` rules

- [#2926](https://github.com/graphql/graphiql/pull/2926) [`10e97bbe`](https://github.com/graphql/graphiql/commit/10e97bbe6c9ff81bae73b11ba81ac2b69eca2772) Thanks [@elijaholmos](https://github.com/elijaholmos)! - support cts and mts file extensions

- [#2937](https://github.com/graphql/graphiql/pull/2937) [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-includes`

- [#2933](https://github.com/graphql/graphiql/pull/2933) [`d502a33b`](https://github.com/graphql/graphiql/commit/d502a33b4332f1025e947c02d7cfdc5799365c8d) Thanks [@B2o5T](https://github.com/B2o5T)! - enable @typescript-eslint/no-unused-expressions

- [#2965](https://github.com/graphql/graphiql/pull/2965) [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-optional-catch-binding` rule

- [#2963](https://github.com/graphql/graphiql/pull/2963) [`f263f778`](https://github.com/graphql/graphiql/commit/f263f778cb95b9f413bd09ca56a43f5b9c2f6215) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `prefer-destructuring` rule

- [#2942](https://github.com/graphql/graphiql/pull/2942) [`4ff2794c`](https://github.com/graphql/graphiql/commit/4ff2794c8b6032168e27252096cb276ce712878e) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `sonarjs/no-redundant-jump` rule

- Updated dependencies [[`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147), [`d1fcad72`](https://github.com/graphql/graphiql/commit/d1fcad72607e2789517dfe4936b5ec604e46762b), [`4a8b2e17`](https://github.com/graphql/graphiql/commit/4a8b2e1766a38eb4828cf9a81bf9d767070041de), [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9), [`c44ea4f1`](https://github.com/graphql/graphiql/commit/c44ea4f1917b97daac815c08299b934c8ca57ed9), [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913), [`18f8e80a`](https://github.com/graphql/graphiql/commit/18f8e80ae12edfd0c36adcb300cf9e06ac27ea49), [`f263f778`](https://github.com/graphql/graphiql/commit/f263f778cb95b9f413bd09ca56a43f5b9c2f6215), [`6a9d913f`](https://github.com/graphql/graphiql/commit/6a9d913f0d1b847124286b3fa1f3a2649d315171)]:
  - graphql-language-service@5.1.1

## 2.9.4

### Patch Changes

- [#2901](https://github.com/graphql/graphiql/pull/2901) [`eff4fd6b`](https://github.com/graphql/graphiql/commit/eff4fd6b9087c2d9cdb260ee2502a31d23769c3f) Thanks [@acao](https://github.com/acao)! - Reload the language service when a legacy format .graphqlconfig file has changed

## 2.9.3

### Patch Changes

- [#2900](https://github.com/graphql/graphiql/pull/2900) [`8989ffce`](https://github.com/graphql/graphiql/commit/8989ffce7d6beca874e70f5a1ff066102580173a) Thanks [@acao](https://github.com/acao)! - use decorators-legacy @babel/parser plugin so that all styles of decorator usage are supported

## 2.9.2

### Patch Changes

- [#2861](https://github.com/graphql/graphiql/pull/2861) [`bdd1bd04`](https://github.com/graphql/graphiql/commit/bdd1bd045fc6610ccaae4745b8ecc10004594274) Thanks [@aloker](https://github.com/aloker)! - add missing pieces for svelte language support

* [#2488](https://github.com/graphql/graphiql/pull/2488) [`967006a6`](https://github.com/graphql/graphiql/commit/967006a68e56f8f3a605c69fee5f920afdb6d8cf) Thanks [@acao](https://github.com/acao)! - Disable`fillLeafsOnComplete` by default

  Users found this generally annoying by default, especially when there are required arguments

  Without automatically prompting autocompletion of required arguments as well as lead expansion, it makes the extension harder to use

  You can now supply this in your graphql config:

  `config.extensions.languageService.fillLeafsOnComplete`

  Setting it to to `true` will enable this feature. Will soon add the ability to manually enable this in `monaco-graphql` as well.

  For both, this kind of behavior would be better as a keyboard command, context menu item &/or codelens prompt

## 2.9.1

### Patch Changes

- [#2829](https://github.com/graphql/graphiql/pull/2829) [`c835ca87`](https://github.com/graphql/graphiql/commit/c835ca87e93e00713fbbbb2f4448db03f6b97b10) Thanks [@acao](https://github.com/acao)! - major bugfixes with `onDidChange` and `onDidChangeWatchedFiles` events

* [#2829](https://github.com/graphql/graphiql/pull/2829) [`c835ca87`](https://github.com/graphql/graphiql/commit/c835ca87e93e00713fbbbb2f4448db03f6b97b10) Thanks [@acao](https://github.com/acao)! - svelte language support, using the vue sfc parser introduced for vue support

## 2.9.0

### Minor Changes

- [#2827](https://github.com/graphql/graphiql/pull/2827) [`b422003c`](https://github.com/graphql/graphiql/commit/b422003c2403072e96d14f920a3f0f1dc1f4f708) Thanks [@acao](https://github.com/acao)! - Introducing vue.js support for intellisense! Thanks @AumyF

## 2.8.9

### Patch Changes

- [#2818](https://github.com/graphql/graphiql/pull/2818) [`929152f8`](https://github.com/graphql/graphiql/commit/929152f8ea076ffa3bf34b83445473331c3bdb67) Thanks [@acao](https://github.com/acao)! - Workspaces support introduced a regression for no-config scenario. Reverting to fix bugs with no graphql config crashing the server.

## 2.8.8

### Patch Changes

- [#2812](https://github.com/graphql/graphiql/pull/2812) [`cf2e3061`](https://github.com/graphql/graphiql/commit/cf2e3061f67ef5cf6b890e217d20915d0eaec1bd) Thanks [@acao](https://github.com/acao)! - fix a bundling bug for vscode, rolling back graphql-config upgrade

## 2.8.7

### Patch Changes

- [#2810](https://github.com/graphql/graphiql/pull/2810) [`f688422e`](https://github.com/graphql/graphiql/commit/f688422ed87ddd411cf3552fa6d9a5a367cd8662) Thanks [@acao](https://github.com/acao)! - fix graphql exec extension, upgrade `graphql-config`, fix issue with graphql-config cosmiconfig typescript config loader.

## 2.8.6

### Patch Changes

- [#2808](https://github.com/graphql/graphiql/pull/2808) [`a2071504`](https://github.com/graphql/graphiql/commit/a20715046fe7684bb9b17fbc9f5637b44e5210d6) Thanks [@acao](https://github.com/acao)! - fix graphql config init bug

## 2.8.5

### Patch Changes

- [#2616](https://github.com/graphql/graphiql/pull/2616) [`b0d7f06c`](https://github.com/graphql/graphiql/commit/b0d7f06cf9ec6fd6b1dcb61dd0273e37dd546ed5) Thanks [@acao](https://github.com/acao)! - support vscode multi-root workspaces! creates an LSP server instance for each workspace.

  WARNING: large-scale vscode workspaces usage, and this in tandem with `graphql.config.*` multi-project configs could lead to excessive system resource usage. Optimizations coming soon.

## 2.8.4

### Patch Changes

- Updated dependencies [[`d6ff4d7a`](https://github.com/graphql/graphiql/commit/d6ff4d7a5d535a0c43fe5914016bac9ef0c2b782)]:
  - graphql-language-service@5.1.0

## 2.8.3

### Patch Changes

- [#2664](https://github.com/graphql/graphiql/pull/2664) [`721425b3`](https://github.com/graphql/graphiql/commit/721425b3382e68dd4c7b883473e3eda38a9816ee) Thanks [@acao](https://github.com/acao)! - This reverts the bugfix for .graphqlrc.ts users, which broke the extension for schema url users

## 2.8.2

### Patch Changes

- [#2660](https://github.com/graphql/graphiql/pull/2660) [`34d31fbc`](https://github.com/graphql/graphiql/commit/34d31fbce6c49c929b48bdf1a6b0cebc33d8bbbf) Thanks [@acao](https://github.com/acao)! - bump `ts-node` to 10.x, so that TypeScript based configs (i.e. `.graphqlrc.ts`) will continue to work. It also bumps to the latest patch releases of `graphql-config` fixed several issues with TypeScript loading ([v4.3.2](https://github.com/kamilkisiela/graphql-config/releases/tag/v4.3.2), [v4.3.3](https://github.com/kamilkisiela/graphql-config/releases/tag/v4.3.3)). We tested manually, but please open a bug if you encounter any with schema-as-url configs & schema introspection.

## 2.8.1

### Patch Changes

- [#2623](https://github.com/graphql/graphiql/pull/2623) [`12cf4db0`](https://github.com/graphql/graphiql/commit/12cf4db006d1c058460bc04f51d8743fe1ac63bb) Thanks [@acao](https://github.com/acao)! - In #2624, fix introspection schema fetching regression in lsp server, and fix for users writing new .gql/.graphql files

## 2.8.0

### Minor Changes

- [#2557](https://github.com/graphql/graphiql/pull/2557) [`3304606d`](https://github.com/graphql/graphiql/commit/3304606d5130a745cbdab0e6c9182e75101ddde9) Thanks [@acao](https://github.com/acao)! - upgrades the `vscode-languageserver` and `vscode-jsonrpc` reference implementations for the lsp server to the latest. also upgrades `vscode-languageclient` in `vscode-graphql` to the latest 8.0.1. seems to work fine for IPC in `vscode-graphql` at least!

  hopefully this solves #2230 once and for all!

## 2.7.29

### Patch Changes

- [#2553](https://github.com/graphql/graphiql/pull/2553) [`edc1c964`](https://github.com/graphql/graphiql/commit/edc1c96477cc2fbc2b6ac5d6195b8f9766a8c5d4) Thanks [@acao](https://github.com/acao)! - Fix error with LSP crash for CLI users #2230. `vscode-graphql` not impacted - rather, `nvim.coc`, maybe other clients who use CLI directly). recreation of #2546 by [@xuanduc987](https://github.com/xuanduc987, thank you!)

## 2.7.28

### Patch Changes

- [#2519](https://github.com/graphql/graphiql/pull/2519) [`de5d5a07`](https://github.com/graphql/graphiql/commit/de5d5a07891fd49241a5abbb17eaf377a015a0a8) Thanks [@acao](https://github.com/acao)! - enable graphql-config legacy mode by default in the LSP server

* [#2509](https://github.com/graphql/graphiql/pull/2509) [`737d4184`](https://github.com/graphql/graphiql/commit/737d4184f3af1d8fe9d64eb1b7e23dfcfbe640ea) Thanks [@Chnapy](https://github.com/Chnapy)! - Add ` gql(``) `, ` graphql(``) ` call expressions support for highlighting & language

## 2.7.27

### Patch Changes

- [#2506](https://github.com/graphql/graphiql/pull/2506) [`cccefa70`](https://github.com/graphql/graphiql/commit/cccefa70c0466d60e8496e1df61aeb1490af723c) Thanks [@acao](https://github.com/acao)! - Remove redundant check, trigger LSP release

- Updated dependencies [[`cccefa70`](https://github.com/graphql/graphiql/commit/cccefa70c0466d60e8496e1df61aeb1490af723c)]:
  - graphql-language-service@5.0.6

## 2.7.26

### Patch Changes

- [#2486](https://github.com/graphql/graphiql/pull/2486) [`c9c51b8a`](https://github.com/graphql/graphiql/commit/c9c51b8a98e1f0427272d3e9ad60989b32f1a1aa) Thanks [@stonexer](https://github.com/stonexer)! - definition support for operation fields ✨

  you can now jump to the applicable object type definition for query/mutation/subscription fields!

- Updated dependencies [[`c9c51b8a`](https://github.com/graphql/graphiql/commit/c9c51b8a98e1f0427272d3e9ad60989b32f1a1aa)]:
  - graphql-language-service@5.0.5

## 2.7.25

### Patch Changes

- [#2481](https://github.com/graphql/graphiql/pull/2481) [`cf092f59`](https://github.com/graphql/graphiql/commit/cf092f5960eae250bb193b9011b2fb883f797a99) Thanks [@acao](https://github.com/acao)! - No longer load dotenv in the LSP server

## 2.7.24

### Patch Changes

- [#2470](https://github.com/graphql/graphiql/pull/2470) [`d0017a93`](https://github.com/graphql/graphiql/commit/d0017a93b818cf3119e51c2b6c4a19004f98e29b) Thanks [@acao](https://github.com/acao)! - Aims to resolve #2421

  - graphql config errors only log to output channel, no longer crash the LSP
  - more performant LSP request no-ops for failing/missing config

  this used to fail silently in the output channel, but vscode introduced a new retry and notification for this

  would like to provide more helpful graphql config DX in the future but this should be better for now

## 2.7.23

### Patch Changes

- [#2417](https://github.com/graphql/graphiql/pull/2417) [`6ca6a92d`](https://github.com/graphql/graphiql/commit/6ca6a92d0fd12af974683de9706c8e8e06c751c2) Thanks [@acao](https://github.com/acao)! - fix annoying trigger character on newline issue #2182

## 2.7.22

### Patch Changes

- [#2385](https://github.com/graphql/graphiql/pull/2385) [`6db28447`](https://github.com/graphql/graphiql/commit/6db284479a14873fea3e359efd71be0b15ab3ee8) Thanks [@acao](https://github.com/acao)! - Stop reporting unnecessary EOF errors when authoring new queries

* [#2382](https://github.com/graphql/graphiql/pull/2382) [`1bea864d`](https://github.com/graphql/graphiql/commit/1bea864d05dee04bb20c06dc3c3d68675b87a50a) Thanks [@acao](https://github.com/acao)! - allow disabling query/SDL validation with `graphql-config` setting `{ extensions: { languageService: { enableValidation: false } } }`.

  Currently, users receive duplicate validation messages when using our LSP alongside existing validation tools like `graphql-eslint`, and this allows them to disable the LSP feature in that case.

## 2.7.21

### Patch Changes

- [#2378](https://github.com/graphql/graphiql/pull/2378) [`d22f6111`](https://github.com/graphql/graphiql/commit/d22f6111a60af25727d8dbc1058c79607df76af2) Thanks [@acao](https://github.com/acao)! - Trap all graphql parsing exceptions from (relatively) newly added logic. This should clear up bugs that have been plaguing users for two years now, sorry!

- Updated dependencies [[`d22f6111`](https://github.com/graphql/graphiql/commit/d22f6111a60af25727d8dbc1058c79607df76af2)]:
  - graphql-language-service@5.0.4

## 2.7.20

### Patch Changes

- Updated dependencies [[`45cbc759`](https://github.com/graphql/graphiql/commit/45cbc759c732999e8b1eb4714d6047ab77c17902)]:
  - graphql-language-service@5.0.3

## 2.7.19

### Patch Changes

- [`c36504a8`](https://github.com/graphql/graphiql/commit/c36504a804d8cc54a5136340152999b4a1a2c69f) Thanks [@acao](https://github.com/acao)! - - upgrade `graphql-config` to latest in server
  - remove `graphql-config` dependency from `vscode-graphql` and `graphql-language-service`
  - fix `vscode-graphql` esbuild bundling bug in `vscode-graphql` [#2269](https://github.com/graphql/graphiql/issues/2269) by fixing `esbuild` version
- Updated dependencies [[`c36504a8`](https://github.com/graphql/graphiql/commit/c36504a804d8cc54a5136340152999b4a1a2c69f)]:
  - graphql-language-service@5.0.2

## 2.7.18

### Patch Changes

- [#2271](https://github.com/graphql/graphiql/pull/2271) [`e15d1dae`](https://github.com/graphql/graphiql/commit/e15d1dae399a7d43d8d98f2ce431a9a1f0ba84ae) Thanks [@acao](https://github.com/acao)! - a few bugfixes related to config handling impacting vim and potentially other LSP server users

## 2.7.17

### Patch Changes

- Updated dependencies [[`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa), [`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa)]:
  - graphql-language-service@5.0.1

## 2.7.16

### Patch Changes

- Updated dependencies [[`2502a364`](https://github.com/graphql/graphiql/commit/2502a364b74dc754d92baa1579b536cf42139958)]:
  - graphql-language-service@5.0.0

## 2.7.15

### Patch Changes

- [#2214](https://github.com/graphql/graphiql/pull/2214) [`ab83198f`](https://github.com/graphql/graphiql/commit/ab83198fa8b3c5453d3733982ee9ca8a2d6bca7a) Thanks [@Cellule](https://github.com/Cellule)! - Fixed Windows fileUri when resolving type definition location

## 2.7.14

### Patch Changes

- [#2161](https://github.com/graphql/graphiql/pull/2161) [`484c0523`](https://github.com/graphql/graphiql/commit/484c0523cdd529f9e261d61a38616b6745075c7f) Thanks [@orta](https://github.com/orta)! - Do not log errors when a JS/TS file has no embedded graphql tags

* [#2176](https://github.com/graphql/graphiql/pull/2176) [`5852ba47`](https://github.com/graphql/graphiql/commit/5852ba47c720a2577817aed512bef9a262254f2c) Thanks [@orta](https://github.com/orta)! - Update babel parser in the graphql language server

- [#2175](https://github.com/graphql/graphiql/pull/2175) [`48c5df65`](https://github.com/graphql/graphiql/commit/48c5df654e323cee3b8c57d7414247465235d1b5) Thanks [@orta](https://github.com/orta)! - Better handling of unparsable babel JS/TS files

- Updated dependencies [[`484c0523`](https://github.com/graphql/graphiql/commit/484c0523cdd529f9e261d61a38616b6745075c7f), [`5852ba47`](https://github.com/graphql/graphiql/commit/5852ba47c720a2577817aed512bef9a262254f2c), [`48c5df65`](https://github.com/graphql/graphiql/commit/48c5df654e323cee3b8c57d7414247465235d1b5)]:
  - graphql-language-service@4.1.5

## 2.7.13

### Patch Changes

- [#2111](https://github.com/graphql/graphiql/pull/2111) [`08ff6dce`](https://github.com/graphql/graphiql/commit/08ff6dce0625f7ab58a45364aed9ca04c7862fa7) Thanks [@acao](https://github.com/acao)! - Support template literals and tagged template literals with replacement expressions

- Updated dependencies []:
  - graphql-language-service@4.1.4

## 2.7.12

### Patch Changes

- Updated dependencies [[`a44772d6`](https://github.com/graphql/graphiql/commit/a44772d6af97254c4f159ea7237e842a3e3719e8)]:
  - graphql-language-service@4.1.3

## 2.7.11

### Patch Changes

- Updated dependencies [[`e20760fb`](https://github.com/graphql/graphiql/commit/e20760fbd95c13d6d549cba3faa15a59aee9a2c0)]:
  - graphql-language-service@4.1.2

## 2.7.10

### Patch Changes

- [#2091](https://github.com/graphql/graphiql/pull/2091) [`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63) Thanks [@acao](https://github.com/acao)! - Fix graphql 15 related issues. Should now build & test interchangeably.

- Updated dependencies [[`ff9cebe5`](https://github.com/graphql/graphiql/commit/ff9cebe515a3539f85b9479954ae644dfeb68b63)]:
  - graphql-language-service-utils@2.7.1
  - graphql-language-service@4.1.1

## 2.7.9

### Patch Changes

- Updated dependencies [[`0f1f90ce`](https://github.com/graphql/graphiql/commit/0f1f90ce8f4a25ddebdaf7a9ddbe136214aa64a3)]:
  - graphql-language-service@4.1.0

## 2.7.8

### Patch Changes

- Updated dependencies [[`9df315b4`](https://github.com/graphql/graphiql/commit/9df315b44896efa313ed6744445fc8f9e702ebc3)]:
  - graphql-language-service-utils@2.7.0
  - graphql-language-service@4.0.0

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

  `fileURLToPath` had been introduced by a contributor and I didn't test properly, it broke sdl file loading!

  definitions, autocomplete, diagnostics, etc should work again also hides the more verbose logging output for now

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

- [`7e98c6ff`](https://github.com/graphql/graphiql/commit/7e98c6fff3b1c62954c9c8d902ac64ddbf23fc5d) Thanks [@acao](https://github.com/acao)! - upgrade graphql-language-service-server to use graphql-config 4.1.0! adds support for .ts and .toml config files in the language server, amongst many other improvements!

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

- pre-caching schema bugs, new server config options ([#1636](https://github.com/graphql/graphiql/issues/1636)) ([d989456](https://github.com/graphql/graphiql/commit/d9894564c056134e15093956e0951dcefe061d76))

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

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitsch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.0.1 (2017-03-29)

# 2.2.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitsch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.0.1 (2017-03-29)

# 2.2.0-alpha.0 (2019-10-04)

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitsch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

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
