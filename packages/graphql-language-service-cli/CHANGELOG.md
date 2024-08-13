# graphql-language-service-cli

## 3.5.0

### Minor Changes

- [#3682](https://github.com/graphql/graphiql/pull/3682) [`6c9f0df`](https://github.com/graphql/graphiql/commit/6c9f0df83ea4afe7fa59f84d83d59fba73dc3931) Thanks [@yaacovCR](https://github.com/yaacovCR)! - Support v17 of `graphql-js` from `17.0.0-alpha.2` forward.

  Includes support for the latest incremental delivery response format. For further details, see https://github.com/graphql/defer-stream-wg/discussions/69.

### Patch Changes

- Updated dependencies [[`6c9f0df`](https://github.com/graphql/graphiql/commit/6c9f0df83ea4afe7fa59f84d83d59fba73dc3931)]:
  - graphql-language-service-server@2.14.0
  - graphql-language-service@5.3.0

## 3.4.2

### Patch Changes

- [#3647](https://github.com/graphql/graphiql/pull/3647) [`ba5720b`](https://github.com/graphql/graphiql/commit/ba5720b430ed1c888ff64c67aa4b9a36083b9ed0) Thanks [@acao](https://github.com/acao)! - several LSP fixes and improvements:

  **Bugfixes**

  debounce schema change events to fix codegen bugs to fix #3622

  on mass file changes, network schema is overfetching because the schema cache is now invalidated on every watched schema file change

  to address this, we debounce the new `onSchemaChange` event by 400ms

  note that `schemaCacheTTL` can only be set in extension settings or graphql config at the top level - it will be ignored if configured per-project in the graphql config

  **Code Improvements**

  - Fixes flaky tests, and `schemaCacheTTL` setting not being passed to the cache
  - Adds a test to validate network schema changes are reflected in the cache

- Updated dependencies [[`ba5720b`](https://github.com/graphql/graphiql/commit/ba5720b430ed1c888ff64c67aa4b9a36083b9ed0), [`fdec377`](https://github.com/graphql/graphiql/commit/fdec377f28ac0d918a219b78dfa2d8f0996ff84d), [`e2c04c7`](https://github.com/graphql/graphiql/commit/e2c04c7c2dc5109ff0446d9a6a010ffdffed1e44)]:
  - graphql-language-service-server@2.13.2
  - graphql-language-service@5.2.2

## 3.4.1

### Patch Changes

- [#3628](https://github.com/graphql/graphiql/pull/3628) [`7fad662f`](https://github.com/graphql/graphiql/commit/7fad662f77eae9f842bb55cb93cb98df33bbc1ed) Thanks [@acao](https://github.com/acao)! - fix the lsp stream interface for stdin/out (neovim, etc)

- Updated dependencies [[`7fad662f`](https://github.com/graphql/graphiql/commit/7fad662f77eae9f842bb55cb93cb98df33bbc1ed)]:
  - graphql-language-service-server@2.13.1

## 3.4.0

### Minor Changes

- [#3521](https://github.com/graphql/graphiql/pull/3521) [`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d) Thanks [@acao](https://github.com/acao)! - Fix many schema and fragment lifecycle issues, not all of them, but many related to cacheing. Note: this makes `cacheSchemaForLookup` enabled by default again for schema first contexts.

  This fixes multiple cacheing bugs, upon addomg some in-depth integration test coverage for the LSP server. It also solves several bugs regarding loading config types, and properly restarts the server and invalidates schema when there are config changes.

  ### Bugfix Summary

  - configurable polling updates for network and other code first schema configuration, set to a 30s interval by default. powered by `schemaCacheTTL` which can be configured in the IDE settings (vscode, nvim) or in the graphql config file. (1)
  - jump to definition in embedded files offset bug, for both fragments and code files with SDL strings
  - cache invalidation for fragments (fragment lookup/autcoomplete data is more accurate, but incomplete/invalid fragments still do not autocomplete or validate, and remember fragment options always filter/validate by the `on` type!)
  - schema cache invalidation for schema files - schema updates as you change the SDL files, and the generated file for code first by the `schemaCacheTTL` setting
  - schema definition lookups & autocomplete crossing over into the wrong project

  **Notes**

  1. If possible, configuring for your locally running framework or a schema registry client to handle schema updates and output to a `schema.graphql` or `introspection.json` will always provide a better experience. many graphql frameworks have this built in! Otherwise, we must use this new lazy polling approach if you provide a url schema (this includes both introspection URLs and remote file URLs, and the combination of these).

  ### Known Bugs Fixed

  - #3318
  - #2357
  - #3469
  - #2422
  - #2820
  - many more!

  ### Test Improvements

  - new, high level integration spec suite for the LSP with a matching test utility
  - more unit test coverage
  - **total increased test coverage of about 25% in the LSP server codebase.**
  - many "happy paths" covered for both schema and code first contexts
  - many bugs revealed (and their source)

  ### What's next?

  Another stage of the rewrite is already almost ready. This will fix even more bugs and improve memory usage, eliminate redundant parsing and ensure that graphql config's loaders do _all_ of the parsing and heavy lifting, thus honoring all the configs as well. It also significantly reduces the code complexity.

  There is also a plan to match Relay LSP's lookup config for either IDE (vscode, nvm, etc) settings as they provide, or by loading modules into your `graphql-config`!

### Patch Changes

- [#3521](https://github.com/graphql/graphiql/pull/3521) [`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d) Thanks [@acao](https://github.com/acao)! - Fixes several issues with Type System (SDL) completion across the ecosystem:

  - restores completion for object and input type fields when the document context is not detectable or parseable
  - correct top-level completions for either of the unknown, type system or executable definitions. this leads to mixed top level completions when the document is unparseable, but now you are not seemingly restricted to only executable top level definitions
  - `.graphqls` ad-hoc standard functionality remains, but is not required, as it is not part of the official spec, and the spec also allows mixed mode documents in theory, and this concept is required when the type is unknown

- [#3521](https://github.com/graphql/graphiql/pull/3521) [`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d) Thanks [@acao](https://github.com/acao)! - Introduce `locateCommand` based on Relay LSP `pathToLocateCommand`:

  Now with `<graphql config>.extensions.languageService.locateCommand`, you can specify either the [existing signature](https://marketplace.visualstudio.com/items?itemName=meta.relay#relay.pathtolocatecommand-default-null) for relay, with the same callback parameters and return signature (of a string delimited by `:` characters), or you can return an object with {uri, range} for the exact set of coordinates for the destination range. the function can be sync or async.

  Relay LSP currently supports `Type` and `Type.field` for the 2nd argument. Ours also returns `Type.field(argument)` as a point of reference. It works with object types, input types, fragments, executable definitions and their fields, and should work for directive definitions as well.

  In the case of unnamed types such as fragment spreads, they return the name of the implemented type currently, but I'm curious what users prefer here. I assumed that some people may want to not be limited to only using this for SDL type definition lookups. Also look soon to see `locateCommand` support added for symbols, outline, and coming references and implementations.

  The module at the path you specify in relay LSP for `pathToLocateCommand` should work as such.

  ```ts
  // import it
  import { locateCommand } from './graphql/tooling/lsp/locate.js';
  export default {
    languageService: {
      locateCommand,
    },

    projects: {
      a: {
        schema: 'https://localhost:8000/graphql',
        documents: './a/**/*.{ts,tsx,jsx,js,graphql}',
      },
      b: {
        schema: './schema/ascode.ts',
        documents: './b/**/*.{ts,tsx,jsx,js,graphql}',
      },
    },
  };
  ```

  ```ts
  // or define it inline

  import { type LocateCommand } from 'graphql-language-service-server';

  // relay LSP style
  const locateCommand = (projectName: string, typePath: string) => {
    const { path, startLine, endLine } = ourLookupUtility(
      projectName,
      typePath,
    );
    return `${path}:${startLine}:${endLine}`;
  };

  // an example with our alternative return signature
  const locateCommand: LocateCommand = (projectName, typePath, info) => {
    // pass more info, such as GraphQLType with the ast node. info.project is also available if you need it
    const { path, range } = ourLookupUtility(
      projectName,
      typePath,
      info.type.node,
    );
    return { uri: path, range }; // range.start.line/range.end.line
  };

  export default {
    languageService: {
      locateCommand,
    },
    schema: 'https://localhost:8000/graphql',
    documents: './**/*.{ts,tsx,jsx,js,graphql}',
  };
  ```

  Passing a string as a module path to resolve is coming in a follow-up release. Then it can be used with `.yml`, `.toml`, `.json`, `package.json#graphql`, etc

  For now this was a quick baseline for a feature asked for in multiple channels!

  Let us know how this works, and about any other interoperability improvements between our graphql LSP and other language servers (relay, intellij, etc) used by you and colleauges in your engineering organisations. We are trying our best to keep up with the awesome innovations they have 👀!

- Updated dependencies [[`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d), [`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d), [`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d)]:
  - graphql-language-service-server@2.13.0
  - graphql-language-service@5.2.1

## 3.3.33

### Patch Changes

- Updated dependencies [[`98af5307`](https://github.com/graphql/graphiql/commit/98af53071bb27afc0afc82d66f539c1ac08315b3), [`36c7f25c`](https://github.com/graphql/graphiql/commit/36c7f25c9388827d3a6a279eb090d61dc2600b56)]:
  - graphql-language-service-server@2.12.0

## 3.3.32

### Patch Changes

- Updated dependencies [[`6c7adf85`](https://github.com/graphql/graphiql/commit/6c7adf85c10d92cd3708a6dab44cb5b0f965fb84)]:
  - graphql-language-service-server@2.11.10

## 3.3.31

### Patch Changes

- Updated dependencies [[`34d0a976`](https://github.com/graphql/graphiql/commit/34d0a97688d7b83949f34bb4b2effebe4bafae79)]:
  - graphql-language-service-server@2.11.9

## 3.3.30

### Patch Changes

- Updated dependencies [[`3bfb2877`](https://github.com/graphql/graphiql/commit/3bfb28777457f783852dfe5c9af739470194d33b)]:
  - graphql-language-service-server@2.11.8

## 3.3.29

### Patch Changes

- [#3488](https://github.com/graphql/graphiql/pull/3488) [`d5028be2`](https://github.com/graphql/graphiql/commit/d5028be252ed385af972e090dda22788835da71e) Thanks [@acao](https://github.com/acao)! - Bump graphql & graphql-tools version to fix potential runtime security bugs

- [`22771f35`](https://github.com/graphql/graphiql/commit/22771f35d00e4f80cb851e2a1f93db074e238e18) Thanks [@acao](https://github.com/acao)! - Fixes to svelte parsing, tag parsing refactor

- Updated dependencies [[`d5028be2`](https://github.com/graphql/graphiql/commit/d5028be252ed385af972e090dda22788835da71e), [`22771f35`](https://github.com/graphql/graphiql/commit/22771f35d00e4f80cb851e2a1f93db074e238e18)]:
  - graphql-language-service-server@2.11.7

## 3.3.28

### Patch Changes

- Updated dependencies [[`75ccd72c`](https://github.com/graphql/graphiql/commit/75ccd72c660c3b20cafa38da01d18a91ea24c7db)]:
  - graphql-language-service-server@2.11.6

## 3.3.27

### Patch Changes

- Updated dependencies [[`530ef47a`](https://github.com/graphql/graphiql/commit/530ef47ac6bbcb24cedc453bf802626d4a630e45)]:
  - graphql-language-service-server@2.11.5

## 3.3.26

### Patch Changes

- Updated dependencies [[`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c), [`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c)]:
  - graphql-language-service@5.2.0
  - graphql-language-service-server@2.11.4

## 3.3.25

### Patch Changes

- [#3322](https://github.com/graphql/graphiql/pull/3322) [`6939bac4`](https://github.com/graphql/graphiql/commit/6939bac4a9a849fe497260fd0702bdd95eefd943) Thanks [@acao](https://github.com/acao)! - Bypass babel typescript parsing errors to continue extracting graphql strings

- Updated dependencies [[`6939bac4`](https://github.com/graphql/graphiql/commit/6939bac4a9a849fe497260fd0702bdd95eefd943)]:
  - graphql-language-service-server@2.11.3

## 3.3.24

### Patch Changes

- [#3224](https://github.com/graphql/graphiql/pull/3224) [`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9) Thanks [@acao](https://github.com/acao)! - try removing some packages from pre.json

- Updated dependencies [[`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9), [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5), [`55135804`](https://github.com/graphql/graphiql/commit/551358045611a27551e5654c2b115295c35639d8)]:
  - graphql-language-service-server@2.11.2
  - graphql-language-service@5.1.7

## 3.3.24-alpha.0

### Patch Changes

- [#3224](https://github.com/graphql/graphiql/pull/3224) [`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9) Thanks [@acao](https://github.com/acao)! - try removing some packages from pre.json

- Updated dependencies [[`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9), [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5), [`55135804`](https://github.com/graphql/graphiql/commit/551358045611a27551e5654c2b115295c35639d8)]:
  - graphql-language-service-server@2.11.2-alpha.0
  - graphql-language-service@5.1.7-alpha.0

## 3.3.23

### Patch Changes

- Updated dependencies [[`4c3a08b1`](https://github.com/graphql/graphiql/commit/4c3a08b1a99e0933362a1c93340b613730c90aa4)]:
  - graphql-language-service-server@2.11.1

## 3.3.22

### Patch Changes

- [#3148](https://github.com/graphql/graphiql/pull/3148) [`06007498`](https://github.com/graphql/graphiql/commit/06007498880528ed75dd4d705dcbcd7c9e775939) Thanks [@mskelton](https://github.com/mskelton)! - Use native LSP logger instead of manual file based logging. This fixes errors in Neovim when using the GraphQL LSP.

- Updated dependencies [[`06007498`](https://github.com/graphql/graphiql/commit/06007498880528ed75dd4d705dcbcd7c9e775939), [`28b1b5a0`](https://github.com/graphql/graphiql/commit/28b1b5a016787ec4119d28f057a9d93814d4e310)]:
  - graphql-language-service-server@2.11.0
  - graphql-language-service@5.1.6

## 3.3.21

### Patch Changes

- Updated dependencies [[`f2040452`](https://github.com/graphql/graphiql/commit/f20404529677635f5d4792b328aa648641bf8d9c)]:
  - graphql-language-service-server@2.10.0

## 3.3.20

### Patch Changes

- Updated dependencies [[`4d33b221`](https://github.com/graphql/graphiql/commit/4d33b2214e941f171385a1b72a1fa995714bb284)]:
  - graphql-language-service-server@2.9.10
  - graphql-language-service@5.1.5

## 3.3.19

### Patch Changes

- Updated dependencies [[`632a7c6b`](https://github.com/graphql/graphiql/commit/632a7c6bb2959ef5d59236aeab218587578466e7)]:
  - graphql-language-service-server@2.9.9

## 3.3.18

### Patch Changes

- [#3109](https://github.com/graphql/graphiql/pull/3109) [`51007002`](https://github.com/graphql/graphiql/commit/510070028b7d8e98f2ba25f396519976aea5fa4b) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-floating-promises` eslint rule

- Updated dependencies [[`2e477eb2`](https://github.com/graphql/graphiql/commit/2e477eb24672a242ae4a4f2dfaeaf41152ed7ee9), [`06d39823`](https://github.com/graphql/graphiql/commit/06d39823e093c8441fea469446c25f18a664e778), [`51007002`](https://github.com/graphql/graphiql/commit/510070028b7d8e98f2ba25f396519976aea5fa4b), [`15c26eb6`](https://github.com/graphql/graphiql/commit/15c26eb6d621a85df9eecb2b8a5fa009fa2fe040)]:
  - graphql-language-service@5.1.4
  - graphql-language-service-server@2.9.8

## 3.3.17

### Patch Changes

- [#3046](https://github.com/graphql/graphiql/pull/3046) [`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer .at() method for index access

- Updated dependencies [[`9d9478ae`](https://github.com/graphql/graphiql/commit/9d9478aea7536d2957e4371cef4f30577db2113d), [`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d), [`881a2024`](https://github.com/graphql/graphiql/commit/881a202497d5a58eb5260a5aa54c0c88930d69a0)]:
  - graphql-language-service-server@2.9.7
  - graphql-language-service@5.1.3

## 3.3.16

### Patch Changes

- [#2940](https://github.com/graphql/graphiql/pull/2940) [`8725d1b6`](https://github.com/graphql/graphiql/commit/8725d1b6b686139286cf05dec6a84d89942128ba) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-node-protocol` rule

- Updated dependencies [[`e68cb8bc`](https://github.com/graphql/graphiql/commit/e68cb8bcaf9baddf6fca747abab871ecd1bc7a4c), [`f788e65a`](https://github.com/graphql/graphiql/commit/f788e65aff267ec873237034831d1fd936222a9b), [`bdc966cb`](https://github.com/graphql/graphiql/commit/bdc966cba6134a72ff7fe40f76543c77ba15d4a4), [`db2a0982`](https://github.com/graphql/graphiql/commit/db2a0982a17134f0069483ab283594eb64735b7d), [`90350022`](https://github.com/graphql/graphiql/commit/90350022334d9fcce0f4b72b3b0f7a12d21f78f9), [`8725d1b6`](https://github.com/graphql/graphiql/commit/8725d1b6b686139286cf05dec6a84d89942128ba)]:
  - graphql-language-service@5.1.2
  - graphql-language-service-server@2.9.6

## 3.3.15

### Patch Changes

- [#2922](https://github.com/graphql/graphiql/pull/2922) [`d1fcad72`](https://github.com/graphql/graphiql/commit/d1fcad72607e2789517dfe4936b5ec604e46762b) Thanks [@B2o5T](https://github.com/B2o5T)! - extends `plugin:import/recommended` and fix warnings

- [#2966](https://github.com/graphql/graphiql/pull/2966) [`f9aa87dc`](https://github.com/graphql/graphiql/commit/f9aa87dc6a88ed8a8a0a94de520c7a41fff8ffde) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `sonarjs/no-small-switch` and `sonarjs/no-duplicated-branches` rules

- [#2938](https://github.com/graphql/graphiql/pull/2938) [`6a9d913f`](https://github.com/graphql/graphiql/commit/6a9d913f0d1b847124286b3fa1f3a2649d315171) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/throw-new-error` rule

- Updated dependencies [[`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147), [`d1fcad72`](https://github.com/graphql/graphiql/commit/d1fcad72607e2789517dfe4936b5ec604e46762b), [`4a8b2e17`](https://github.com/graphql/graphiql/commit/4a8b2e1766a38eb4828cf9a81bf9d767070041de), [`f9aa87dc`](https://github.com/graphql/graphiql/commit/f9aa87dc6a88ed8a8a0a94de520c7a41fff8ffde), [`10e97bbe`](https://github.com/graphql/graphiql/commit/10e97bbe6c9ff81bae73b11ba81ac2b69eca2772), [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9), [`c44ea4f1`](https://github.com/graphql/graphiql/commit/c44ea4f1917b97daac815c08299b934c8ca57ed9), [`d502a33b`](https://github.com/graphql/graphiql/commit/d502a33b4332f1025e947c02d7cfdc5799365c8d), [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913), [`18f8e80a`](https://github.com/graphql/graphiql/commit/18f8e80ae12edfd0c36adcb300cf9e06ac27ea49), [`f263f778`](https://github.com/graphql/graphiql/commit/f263f778cb95b9f413bd09ca56a43f5b9c2f6215), [`6a9d913f`](https://github.com/graphql/graphiql/commit/6a9d913f0d1b847124286b3fa1f3a2649d315171), [`4ff2794c`](https://github.com/graphql/graphiql/commit/4ff2794c8b6032168e27252096cb276ce712878e)]:
  - graphql-language-service@5.1.1
  - graphql-language-service-server@2.9.5

## 3.3.14

### Patch Changes

- [#2901](https://github.com/graphql/graphiql/pull/2901) [`eff4fd6b`](https://github.com/graphql/graphiql/commit/eff4fd6b9087c2d9cdb260ee2502a31d23769c3f) Thanks [@acao](https://github.com/acao)! - Reload the language service when a legacy format .graphqlconfig file has changed

- Updated dependencies [[`eff4fd6b`](https://github.com/graphql/graphiql/commit/eff4fd6b9087c2d9cdb260ee2502a31d23769c3f)]:
  - graphql-language-service-server@2.9.4

## 3.3.13

### Patch Changes

- [#2900](https://github.com/graphql/graphiql/pull/2900) [`8989ffce`](https://github.com/graphql/graphiql/commit/8989ffce7d6beca874e70f5a1ff066102580173a) Thanks [@acao](https://github.com/acao)! - use decorators-legacy @babel/parser plugin so that all styles of decorator usage are supported
- Updated dependencies [[`8989ffce`](https://github.com/graphql/graphiql/commit/8989ffce7d6beca874e70f5a1ff066102580173a)]:
  - graphql-language-service-server@2.9.3

## 3.3.12

### Patch Changes

- Updated dependencies [[`bdd1bd04`](https://github.com/graphql/graphiql/commit/bdd1bd045fc6610ccaae4745b8ecc10004594274), [`967006a6`](https://github.com/graphql/graphiql/commit/967006a68e56f8f3a605c69fee5f920afdb6d8cf)]:
  - graphql-language-service-server@2.9.2

## 3.3.11

### Patch Changes

- [#2829](https://github.com/graphql/graphiql/pull/2829) [`c835ca87`](https://github.com/graphql/graphiql/commit/c835ca87e93e00713fbbbb2f4448db03f6b97b10) Thanks [@acao](https://github.com/acao)! - svelte language support, using the vue sfc parser introduced for vue support

- Updated dependencies [[`c835ca87`](https://github.com/graphql/graphiql/commit/c835ca87e93e00713fbbbb2f4448db03f6b97b10), [`c835ca87`](https://github.com/graphql/graphiql/commit/c835ca87e93e00713fbbbb2f4448db03f6b97b10)]:
  - graphql-language-service-server@2.9.1

## 3.3.10

### Patch Changes

- Updated dependencies [[`b422003c`](https://github.com/graphql/graphiql/commit/b422003c2403072e96d14f920a3f0f1dc1f4f708)]:
  - graphql-language-service-server@2.9.0

## 3.3.9

### Patch Changes

- Updated dependencies [[`929152f8`](https://github.com/graphql/graphiql/commit/929152f8ea076ffa3bf34b83445473331c3bdb67)]:
  - graphql-language-service-server@2.8.9

## 3.3.8

### Patch Changes

- [#2812](https://github.com/graphql/graphiql/pull/2812) [`cf2e3061`](https://github.com/graphql/graphiql/commit/cf2e3061f67ef5cf6b890e217d20915d0eaec1bd) Thanks [@acao](https://github.com/acao)! - fix a bundling bug for vscode, rolling back graphql-config upgrade

- Updated dependencies [[`cf2e3061`](https://github.com/graphql/graphiql/commit/cf2e3061f67ef5cf6b890e217d20915d0eaec1bd)]:
  - graphql-language-service-server@2.8.8

## 3.3.7

### Patch Changes

- Updated dependencies [[`f688422e`](https://github.com/graphql/graphiql/commit/f688422ed87ddd411cf3552fa6d9a5a367cd8662)]:
  - graphql-language-service-server@2.8.7

## 3.3.6

### Patch Changes

- Updated dependencies [[`a2071504`](https://github.com/graphql/graphiql/commit/a20715046fe7684bb9b17fbc9f5637b44e5210d6)]:
  - graphql-language-service-server@2.8.6

## 3.3.5

### Patch Changes

- [#2616](https://github.com/graphql/graphiql/pull/2616) [`b0d7f06c`](https://github.com/graphql/graphiql/commit/b0d7f06cf9ec6fd6b1dcb61dd0273e37dd546ed5) Thanks [@acao](https://github.com/acao)! - support vscode multi-root workspaces! creates an LSP server instance for each workspace.

  WARNING: large-scale vscode workspaces usage, and this in tandem with `graphql.config.*` multi-project configs could lead to excessive system resource usage. Optimizations coming soon.

- Updated dependencies [[`b0d7f06c`](https://github.com/graphql/graphiql/commit/b0d7f06cf9ec6fd6b1dcb61dd0273e37dd546ed5)]:
  - graphql-language-service-server@2.8.5

## 3.3.4

### Patch Changes

- Updated dependencies [[`d6ff4d7a`](https://github.com/graphql/graphiql/commit/d6ff4d7a5d535a0c43fe5914016bac9ef0c2b782)]:
  - graphql-language-service@5.1.0
  - graphql-language-service-server@2.8.4

## 3.3.3

### Patch Changes

- Updated dependencies [[`721425b3`](https://github.com/graphql/graphiql/commit/721425b3382e68dd4c7b883473e3eda38a9816ee)]:
  - graphql-language-service-server@2.8.3

## 3.3.2

### Patch Changes

- [#2660](https://github.com/graphql/graphiql/pull/2660) [`34d31fbc`](https://github.com/graphql/graphiql/commit/34d31fbce6c49c929b48bdf1a6b0cebc33d8bbbf) Thanks [@acao](https://github.com/acao)! - bump `ts-node` to 10.x, so that TypeScript based configs (i.e. `.graphqlrc.ts`) will continue to work. It also bumps to the latest patch releases of `graphql-config` fixed several issues with TypeScript loading ([v4.3.2](https://github.com/kamilkisiela/graphql-config/releases/tag/v4.3.2), [v4.3.3](https://github.com/kamilkisiela/graphql-config/releases/tag/v4.3.3)). We tested manually, but please open a bug if you encounter any with schema-as-url configs & schema introspection.

- Updated dependencies [[`34d31fbc`](https://github.com/graphql/graphiql/commit/34d31fbce6c49c929b48bdf1a6b0cebc33d8bbbf)]:
  - graphql-language-service-server@2.8.2

## 3.3.1

### Patch Changes

- Updated dependencies [[`12cf4db0`](https://github.com/graphql/graphiql/commit/12cf4db006d1c058460bc04f51d8743fe1ac63bb)]:
  - graphql-language-service-server@2.8.1

## 3.3.0

### Minor Changes

- [#2557](https://github.com/graphql/graphiql/pull/2557) [`3304606d`](https://github.com/graphql/graphiql/commit/3304606d5130a745cbdab0e6c9182e75101ddde9) Thanks [@acao](https://github.com/acao)! - upgrades the `vscode-languageserver` and `vscode-jsonrpc` reference implementations for the lsp server to the latest. also upgrades `vscode-languageclient` in `vscode-graphql` to the latest 8.0.1. seems to work fine for IPC in `vscode-graphql` at least!

  hopefully this solves #2230 once and for all!

### Patch Changes

- Updated dependencies [[`3304606d`](https://github.com/graphql/graphiql/commit/3304606d5130a745cbdab0e6c9182e75101ddde9)]:
  - graphql-language-service-server@2.8.0

## 3.2.30

### Patch Changes

- [#2553](https://github.com/graphql/graphiql/pull/2553) [`edc1c964`](https://github.com/graphql/graphiql/commit/edc1c96477cc2fbc2b6ac5d6195b8f9766a8c5d4) Thanks [@acao](https://github.com/acao)! - Fix error with LSP crash for CLI users #2230. `vscode-graphql` not impacted - rather, `nvim.coc`, maybe other clients who use CLI directly). recreation of #2546 by [@xuanduc987](https://github.com/xuanduc987, thank you!)

- Updated dependencies [[`edc1c964`](https://github.com/graphql/graphiql/commit/edc1c96477cc2fbc2b6ac5d6195b8f9766a8c5d4)]:
  - graphql-language-service-server@2.7.29

## 3.2.29

### Patch Changes

- [#2519](https://github.com/graphql/graphiql/pull/2519) [`de5d5a07`](https://github.com/graphql/graphiql/commit/de5d5a07891fd49241a5abbb17eaf377a015a0a8) Thanks [@acao](https://github.com/acao)! - enable graphql-config legacy mode by default in the LSP server

* [#2509](https://github.com/graphql/graphiql/pull/2509) [`737d4184`](https://github.com/graphql/graphiql/commit/737d4184f3af1d8fe9d64eb1b7e23dfcfbe640ea) Thanks [@Chnapy](https://github.com/Chnapy)! - Add `gql(``)`, `graphql(``)` call expressions support for highlighting & language

* Updated dependencies [[`de5d5a07`](https://github.com/graphql/graphiql/commit/de5d5a07891fd49241a5abbb17eaf377a015a0a8), [`737d4184`](https://github.com/graphql/graphiql/commit/737d4184f3af1d8fe9d64eb1b7e23dfcfbe640ea)]:
  - graphql-language-service-server@2.7.28

## 3.2.28

### Patch Changes

- Updated dependencies [[`cccefa70`](https://github.com/graphql/graphiql/commit/cccefa70c0466d60e8496e1df61aeb1490af723c)]:
  - graphql-language-service-server@2.7.27
  - graphql-language-service@5.0.6

## 3.2.27

### Patch Changes

- [#2486](https://github.com/graphql/graphiql/pull/2486) [`c9c51b8a`](https://github.com/graphql/graphiql/commit/c9c51b8a98e1f0427272d3e9ad60989b32f1a1aa) Thanks [@stonexer](https://github.com/stonexer)! - definition support for operation fields ✨

  you can now jump to the applicable object type definition for query/mutation/subscription fields!

- Updated dependencies [[`c9c51b8a`](https://github.com/graphql/graphiql/commit/c9c51b8a98e1f0427272d3e9ad60989b32f1a1aa)]:
  - graphql-language-service-server@2.7.26
  - graphql-language-service@5.0.5

## 3.2.26

### Patch Changes

- Updated dependencies [[`cf092f59`](https://github.com/graphql/graphiql/commit/cf092f5960eae250bb193b9011b2fb883f797a99)]:
  - graphql-language-service-server@2.7.25

## 3.2.25

### Patch Changes

- Updated dependencies [[`d0017a93`](https://github.com/graphql/graphiql/commit/d0017a93b818cf3119e51c2b6c4a19004f98e29b)]:
  - graphql-language-service-server@2.7.24

## 3.2.24

### Patch Changes

- Updated dependencies [[`6ca6a92d`](https://github.com/graphql/graphiql/commit/6ca6a92d0fd12af974683de9706c8e8e06c751c2)]:
  - graphql-language-service-server@2.7.23

## 3.2.23

### Patch Changes

- Updated dependencies [[`6db28447`](https://github.com/graphql/graphiql/commit/6db284479a14873fea3e359efd71be0b15ab3ee8), [`1bea864d`](https://github.com/graphql/graphiql/commit/1bea864d05dee04bb20c06dc3c3d68675b87a50a)]:
  - graphql-language-service-server@2.7.22

## 3.2.22

### Patch Changes

- Updated dependencies [[`d22f6111`](https://github.com/graphql/graphiql/commit/d22f6111a60af25727d8dbc1058c79607df76af2)]:
  - graphql-language-service@5.0.4
  - graphql-language-service-server@2.7.21

## 3.2.21

### Patch Changes

- [#2291](https://github.com/graphql/graphiql/pull/2291) [`45cbc759`](https://github.com/graphql/graphiql/commit/45cbc759c732999e8b1eb4714d6047ab77c17902) Thanks [@retrodaredevil](https://github.com/retrodaredevil)! - Target es6 for the languages services

- Updated dependencies [[`45cbc759`](https://github.com/graphql/graphiql/commit/45cbc759c732999e8b1eb4714d6047ab77c17902)]:
  - graphql-language-service@5.0.3
  - graphql-language-service-server@2.7.20

## 3.2.20

### Patch Changes

- Updated dependencies [[`c36504a8`](https://github.com/graphql/graphiql/commit/c36504a804d8cc54a5136340152999b4a1a2c69f)]:
  - graphql-language-service@5.0.2
  - graphql-language-service-server@2.7.19

## 3.2.19

### Patch Changes

- Updated dependencies [[`e15d1dae`](https://github.com/graphql/graphiql/commit/e15d1dae399a7d43d8d98f2ce431a9a1f0ba84ae)]:
  - graphql-language-service-server@2.7.18

## 3.2.18

### Patch Changes

- [#2267](https://github.com/graphql/graphiql/pull/2267) [`fe441272`](https://github.com/graphql/graphiql/commit/fe44127296f808e58407855c7f8806e04c8ddf03) Thanks [@elken](https://github.com/elken)! - Re-add `graphql-language-service-server` as a dep to `graphql-language-service-cli`

## 3.2.17

### Patch Changes

- [`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa) Thanks [@acao](https://github.com/acao)! - fix lockfile and imports from LSP merge

- Updated dependencies [[`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa), [`3626f8d5`](https://github.com/graphql/graphiql/commit/3626f8d5012ee77a39e984ae347396cb00fcc6fa)]:
  - graphql-language-service@5.0.1

## 3.2.16

### Patch Changes

- Updated dependencies [[`2502a364`](https://github.com/graphql/graphiql/commit/2502a364b74dc754d92baa1579b536cf42139958)]:
  - graphql-language-service@5.0.0
  - graphql-language-service-server@2.7.16

## 3.2.15

### Patch Changes

- Updated dependencies [[`ab83198f`](https://github.com/graphql/graphiql/commit/ab83198fa8b3c5453d3733982ee9ca8a2d6bca7a)]:
  - graphql-language-service-server@2.7.15

## 3.2.14

### Patch Changes

- Updated dependencies [[`484c0523`](https://github.com/graphql/graphiql/commit/484c0523cdd529f9e261d61a38616b6745075c7f), [`5852ba47`](https://github.com/graphql/graphiql/commit/5852ba47c720a2577817aed512bef9a262254f2c), [`48c5df65`](https://github.com/graphql/graphiql/commit/48c5df654e323cee3b8c57d7414247465235d1b5)]:
  - graphql-language-service-server@2.7.14
  - graphql-language-service@4.1.5

## 3.2.13

### Patch Changes

- Updated dependencies [[`08ff6dce`](https://github.com/graphql/graphiql/commit/08ff6dce0625f7ab58a45364aed9ca04c7862fa7)]:
  - graphql-language-service-server@2.7.13
  - graphql-language-service@4.1.4

## 3.2.12

### Patch Changes

- Updated dependencies [[`a44772d6`](https://github.com/graphql/graphiql/commit/a44772d6af97254c4f159ea7237e842a3e3719e8)]:
  - graphql-language-service@4.1.3
  - graphql-language-service-server@2.7.12

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

  `fileURLToPath` had been introduced by a contributor and I didn't test properly, it broke sdl file loading!

  definitions, autocomplete, diagnostics, etc should work again also hides the more verbose logging output for now

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

- pre-caching schema bugs, new server config options ([#1636](https://github.com/graphql/graphiql/issues/1636)) ([d989456](https://github.com/graphql/graphiql/commit/d9894564c056134e15093956e0951dcefe061d76))

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

- **cli:** recommend matching commands ([#1420](https://github.com/graphql/graphiql/issues/1420)) ([0fbae82](https://github.com/graphql/graphiql/commit/0fbae828ced2e8b95016268805654cde8322b076))
- **graphql-config:** add graphql config extensions ([#1118](https://github.com/graphql/graphiql/issues/1118)) ([2a77e47](https://github.com/graphql/graphiql/commit/2a77e47719ec9181a00183a08ffa11287b8fd2f5))
- capture unknown commands making use of the in-house s… ([#1417](https://github.com/graphql/graphiql/issues/1417)) ([dd12a6b](https://github.com/graphql/graphiql/commit/dd12a6b903976ce8d35cf91d3c9606450f1c0990))
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

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitsch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

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

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitsch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

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

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitsch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

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
