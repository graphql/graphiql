# cm6-graphql

## 0.2.0

### Minor Changes

- [#3762](https://github.com/graphql/graphiql/pull/3762) [`76b3cc8`](https://github.com/graphql/graphiql/commit/76b3cc872dedd667504f58c9313a86bada7688d6) Thanks [@mavenskylab](https://github.com/mavenskylab)! - The cm6-graphql package currently specifies exact versions for its peer dependencies on @codemirror packages. This is causing conflicts when projects use newer versions of these packages, leading to multiple instances being installed.

## 0.1.1

### Patch Changes

- [#3751](https://github.com/graphql/graphiql/pull/3751) [`b8538d8`](https://github.com/graphql/graphiql/commit/b8538d87421edb086b32d4eb2e30a3f7d9d9e893) Thanks [@dimaMachina](https://github.com/dimaMachina)! - replace deprecated `navigator.platform` with `navigator.userAgent`

  fix placeholder `⌘ K` in doc explorer search input for non mac devices, replace by `Ctrl K`

## 0.1.0

### Minor Changes

- [#3682](https://github.com/graphql/graphiql/pull/3682) [`6c9f0df`](https://github.com/graphql/graphiql/commit/6c9f0df83ea4afe7fa59f84d83d59fba73dc3931) Thanks [@yaacovCR](https://github.com/yaacovCR)! - Support v17 of `graphql-js` from `17.0.0-alpha.2` forward.

  Includes support for the latest incremental delivery response format. For further details, see https://github.com/graphql/defer-stream-wg/discussions/69.

### Patch Changes

- Updated dependencies [[`6c9f0df`](https://github.com/graphql/graphiql/commit/6c9f0df83ea4afe7fa59f84d83d59fba73dc3931)]:
  - graphql-language-service@5.3.0

## 0.0.15

### Patch Changes

- [#3521](https://github.com/graphql/graphiql/pull/3521) [`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d) Thanks [@acao](https://github.com/acao)! - Fixes several issues with Type System (SDL) completion across the ecosystem:

  - restores completion for object and input type fields when the document context is not detectable or parseable
  - correct top-level completions for either of the unknown, type system or executable definitions. this leads to mixed top level completions when the document is unparseable, but now you are not seemingly restricted to only executable top level definitions
  - `.graphqls` ad-hoc standard functionality remains, but is not required, as it is not part of the official spec, and the spec also allows mixed mode documents in theory, and this concept is required when the type is unknown

- Updated dependencies [[`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d)]:
  - graphql-language-service@5.2.1

## 0.0.14

### Patch Changes

- [#3534](https://github.com/graphql/graphiql/pull/3534) [`f4c98c1f`](https://github.com/graphql/graphiql/commit/f4c98c1f7c6df5a918479e641631e8fbc5b5a92e) Thanks [@johndcollett](https://github.com/johndcollett)! - fix: multiple argument syntax highlighting

## 0.0.13

### Patch Changes

- [#3505](https://github.com/graphql/graphiql/pull/3505) [`a562c96f`](https://github.com/graphql/graphiql/commit/a562c96fa3953d0301ad7b610028fa6c4a779bf6) Thanks [@Gasser-Aly](https://github.com/Gasser-Aly)! - fix: block strings syntax highlighting

## 0.0.12

### Patch Changes

- [#3463](https://github.com/graphql/graphiql/pull/3463) [`e45ba17c`](https://github.com/graphql/graphiql/commit/e45ba17cb2f13e5a79d3e87b0f30ef92ec55d861) Thanks [@imolorhe](https://github.com/imolorhe)! - Create a lint diagnostic from invalid schema

## 0.0.11

### Patch Changes

- [#3461](https://github.com/graphql/graphiql/pull/3461) [`129666a9`](https://github.com/graphql/graphiql/commit/129666a9a86690bb72226674d40215f24dc5f7ea) Thanks [@imolorhe](https://github.com/imolorhe)! - Wrap cm6-graphql lint logic in try..catch

## 0.0.10

### Patch Changes

- [#3405](https://github.com/graphql/graphiql/pull/3405) [`3d4b9b75`](https://github.com/graphql/graphiql/commit/3d4b9b7551fd9bb38ef9f4a7c6c330366d43bbfa) Thanks [@imolorhe](https://github.com/imolorhe)! - relint when schema changes

- Updated dependencies [[`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c), [`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c)]:
  - graphql-language-service@5.2.0

## 0.0.9

### Patch Changes

- Updated dependencies [[`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9), [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5)]:
  - graphql-language-service@5.1.7

## 0.0.9-alpha.0

### Patch Changes

- Updated dependencies [[`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9), [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5)]:
  - graphql-language-service@5.1.7-alpha.0

## 0.0.8

### Patch Changes

- [#3118](https://github.com/graphql/graphiql/pull/3118) [`431b7fe1`](https://github.com/graphql/graphiql/commit/431b7fe1efefa4867f0ea617adc436b1117052e8) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer `.textContent` over `.innerText`

## 0.0.7

### Patch Changes

- Updated dependencies [[`06007498`](https://github.com/graphql/graphiql/commit/06007498880528ed75dd4d705dcbcd7c9e775939)]:
  - graphql-language-service@5.1.6

## 0.0.6

### Patch Changes

- Updated dependencies [[`4d33b221`](https://github.com/graphql/graphiql/commit/4d33b2214e941f171385a1b72a1fa995714bb284)]:
  - graphql-language-service@5.1.5

## 0.0.5

### Patch Changes

- [#3127](https://github.com/graphql/graphiql/pull/3127) [`0d2bb2bc`](https://github.com/graphql/graphiql/commit/0d2bb2bcc6522e156e2d70f3be553bd4b60c8ee1) Thanks [@imolorhe](https://github.com/imolorhe)! - Updated cm6-graphql package README

- Updated dependencies [[`2e477eb2`](https://github.com/graphql/graphiql/commit/2e477eb24672a242ae4a4f2dfaeaf41152ed7ee9)]:
  - graphql-language-service@5.1.4

## 0.0.4

### Patch Changes

- [#3075](https://github.com/graphql/graphiql/pull/3075) [`9c1a02db`](https://github.com/graphql/graphiql/commit/9c1a02dbff4a39fe999873912daec7dcd1d39b5c) Thanks [@acao](https://github.com/acao)! - another manual release attempt to trigger versioning

- [#3074](https://github.com/graphql/graphiql/pull/3074) [`7cb2a2f1`](https://github.com/graphql/graphiql/commit/7cb2a2f156d918fd57b7d3757ee1ecc0f4dab4ce) Thanks [@acao](https://github.com/acao)! - Fix release bug, trigger changeset release action

- [#3069](https://github.com/graphql/graphiql/pull/3069) [`d922e930`](https://github.com/graphql/graphiql/commit/d922e930f77dff879212ad39191ad6a1b8f7dd8a) Thanks [@sergeichestakov](https://github.com/sergeichestakov)! - Added graphql-language-service as a direct dep of cm6-graphql and update peer dependencies

- Updated dependencies [[`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d), [`881a2024`](https://github.com/graphql/graphiql/commit/881a202497d5a58eb5260a5aa54c0c88930d69a0)]:
  - graphql-language-service@5.1.3

## 0.0.3

### Patch Changes

- [#2995](https://github.com/graphql/graphiql/pull/2995) [`5f276c41`](https://github.com/graphql/graphiql/commit/5f276c415ad93350382fec873025ffecc9a29d9d) Thanks [@imolorhe](https://github.com/imolorhe)! - fix(cm6-graphql): Fix query token used as field name

- [#2962](https://github.com/graphql/graphiql/pull/2962) [`db2a0982`](https://github.com/graphql/graphiql/commit/db2a0982a17134f0069483ab283594eb64735b7d) Thanks [@B2o5T](https://github.com/B2o5T)! - clean all ESLint warnings, add `--max-warnings=0` and `--cache` flags

- [#2940](https://github.com/graphql/graphiql/pull/2940) [`8725d1b6`](https://github.com/graphql/graphiql/commit/8725d1b6b686139286cf05dec6a84d89942128ba) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-node-protocol` rule

## 0.0.2

### Patch Changes

- [#2931](https://github.com/graphql/graphiql/pull/2931) [`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-negated-condition` and `no-else-return` rules

- [#2922](https://github.com/graphql/graphiql/pull/2922) [`d1fcad72`](https://github.com/graphql/graphiql/commit/d1fcad72607e2789517dfe4936b5ec604e46762b) Thanks [@B2o5T](https://github.com/B2o5T)! - extends `plugin:import/recommended` and fix warnings

- [#2992](https://github.com/graphql/graphiql/pull/2992) [`cc245246`](https://github.com/graphql/graphiql/commit/cc2452467688f3cdcd7a196dddf47e3b81367d62) Thanks [@acao](https://github.com/acao)! - fix tsconfig reference, new netlify deploy

## 0.0.1

### Patch Changes

- [#2867](https://github.com/graphql/graphiql/pull/2867) [`9fd12838`](https://github.com/graphql/graphiql/commit/9fd128381a86220a7c658f21d72baa8eea45a8af) Thanks [@imolorhe](https://github.com/imolorhe)! - fix: fixed "Mark decorations may not be empty" error

## 0.0.0

### Patch Changes

- [#2852](https://github.com/graphql/graphiql/pull/2852) [`20869583`](https://github.com/graphql/graphiql/commit/20869583eff563f5d6494e93302a835f0e034f4b) Thanks [@acao](https://github.com/acao)! - First release of a modern codemirror 6 mode for graphql by @imolorhe!
