# @graphiql/react

## 0.5.1

### Patch Changes

- [#2561](https://github.com/graphql/graphiql/pull/2561) [`08346cba`](https://github.com/graphql/graphiql/commit/08346cba136825341881f9dfefc62a60d748e0ee) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add missing effect dependencies to make sure editors are recreated when changing the `keyMap` prop

## 0.5.0

### Minor Changes

- [#2541](https://github.com/graphql/graphiql/pull/2541) [`788d84ef`](https://github.com/graphql/graphiql/commit/788d84ef2784188981f1b4cfb78fba24153bf0cb) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add `onSchemaChange` callback prop to the `SchemaContextProvider` component

### Patch Changes

- [#2545](https://github.com/graphql/graphiql/pull/2545) [`8ce5b483`](https://github.com/graphql/graphiql/commit/8ce5b483ee190b5f5dd84eaf42e5d1359ce185e6) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid top-level dynamic imports from `codemirror` that break importing the package in non-browser environments

## 0.4.3

### Patch Changes

- [#2526](https://github.com/graphql/graphiql/pull/2526) [`26e44120`](https://github.com/graphql/graphiql/commit/26e44120a18d49af451c97619fe3386a65579e05) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add missing `caller` arguments to hook calls so that the error message printed when a context provider is missing is more accurate about the component or hook that caused the error

## 0.4.2

### Patch Changes

- [#2501](https://github.com/graphql/graphiql/pull/2501) [`5437ee61`](https://github.com/graphql/graphiql/commit/5437ee61e1ba6cd28ccc1cb3543df1ea788278f4) Thanks [@acao](https://github.com/acao)! - Allow Codemirror 5 `keyMap` to be defined, default `vim` or `emacs` allowed in addition to the original default of `sublime`.

- Updated dependencies [[`cccefa70`](https://github.com/graphql/graphiql/commit/cccefa70c0466d60e8496e1df61aeb1490af723c)]:
  - graphql-language-service@5.0.6
  - codemirror-graphql@1.3.2

## 0.4.1

### Patch Changes

- Updated dependencies [[`c9c51b8a`](https://github.com/graphql/graphiql/commit/c9c51b8a98e1f0427272d3e9ad60989b32f1a1aa)]:
  - graphql-language-service@5.0.5
  - codemirror-graphql@1.3.1

## 0.4.0

### Minor Changes

- [#2461](https://github.com/graphql/graphiql/pull/2461) [`7dfe3ece`](https://github.com/graphql/graphiql/commit/7dfe3ece4e8ab6b3400888f7f357e394db63439d) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add `useDragResize` utility hook

## 0.3.0

### Minor Changes

- [#2453](https://github.com/graphql/graphiql/pull/2453) [`1b41e33c`](https://github.com/graphql/graphiql/commit/1b41e33c4a871a345836de58f415b7c461ced1f8) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add execution context to `@graphiql/react` and move over the logic from `graphiql`

* [#2452](https://github.com/graphql/graphiql/pull/2452) [`ee0fd8bf`](https://github.com/graphql/graphiql/commit/ee0fd8bf4042053ec647080b83656dc5e54a7239) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move tab state from `graphiql` into editor context from `@graphiql/react`

- [#2449](https://github.com/graphql/graphiql/pull/2449) [`a0b02eda`](https://github.com/graphql/graphiql/commit/a0b02edaa629c6113c1c5518fd3aa05b355a1921) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Assume all context values are nullable and create hooks to consume individual contexts

* [#2450](https://github.com/graphql/graphiql/pull/2450) [`1e6fc68b`](https://github.com/graphql/graphiql/commit/1e6fc68b73941544ee64e0499e459f9c7d39aa14) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Extract the `copy`, `merge`, `prettify`, and `autoCompleteLeafs` functions into hooks and remove these functions from the editor context value

### Patch Changes

- [#2451](https://github.com/graphql/graphiql/pull/2451) [`0659e96e`](https://github.com/graphql/graphiql/commit/0659e96e07f98d532619f29f52cba59e2d528327) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Always use the current value of the headers for the introspection request

## 0.2.1

### Patch Changes

- [#2435](https://github.com/graphql/graphiql/pull/2435) [`89f0244f`](https://github.com/graphql/graphiql/commit/89f0244f7b7cdf01c168638a09f5137788401995) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix deriving default values for editors from storage

* [#2437](https://github.com/graphql/graphiql/pull/2437) [`1f933505`](https://github.com/graphql/graphiql/commit/1f9335051fffc9e6a6f950b6f8060ed521b56789) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move prettify query functionality to editor context in `@graphiql/react`

- [#2435](https://github.com/graphql/graphiql/pull/2435) [`89f0244f`](https://github.com/graphql/graphiql/commit/89f0244f7b7cdf01c168638a09f5137788401995) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic for deriving operation facts from the current query to `@graphiql/react` and store these facts as properties on the query editor instance

* [#2448](https://github.com/graphql/graphiql/pull/2448) [`3dae62fc`](https://github.com/graphql/graphiql/commit/3dae62fc871385e148a799cde55a52a5e6b41d19) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - don't introspect the schema if it's provided via props

- [#2437](https://github.com/graphql/graphiql/pull/2437) [`1f933505`](https://github.com/graphql/graphiql/commit/1f9335051fffc9e6a6f950b6f8060ed521b56789) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move copy query functionality to editor context in `@graphiql/react`

* [#2437](https://github.com/graphql/graphiql/pull/2437) [`1f933505`](https://github.com/graphql/graphiql/commit/1f9335051fffc9e6a6f950b6f8060ed521b56789) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move merge query functionality to editor context in `@graphiql/react`

- [#2436](https://github.com/graphql/graphiql/pull/2436) [`3e5295f0`](https://github.com/graphql/graphiql/commit/3e5295f0fd3b5f999643ea97e6cee706554f0b50) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Inline logic for clicking a reference to open the docs and remove the `onClickReference` and `onHintInformationRender` props of the editor components and hooks

* [#2436](https://github.com/graphql/graphiql/pull/2436) [`3e5295f0`](https://github.com/graphql/graphiql/commit/3e5295f0fd3b5f999643ea97e6cee706554f0b50) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move visibility state for doc explorer from `graphiql` to the explorer context in `@graphiql/react`

## 0.2.0

### Minor Changes

- [#2413](https://github.com/graphql/graphiql/pull/2413) [`8be164b1`](https://github.com/graphql/graphiql/commit/8be164b1e158d00752d6d3f30630a797d07d08c9) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a `StorageContext` and a `HistoryContext` to `@graphiql/react` that replaces the logic in the `graphiql` package

* [#2420](https://github.com/graphql/graphiql/pull/2420) [`3467cd33`](https://github.com/graphql/graphiql/commit/3467cd33264e0766a0a43cf53e52ec371df26962) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a `SchemaContext` to `@graphiql/react` that replaces the logic for fetching and validating the schema in the `graphiql` package

### Patch Changes

- Updated dependencies [[`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e), [`8be164b1`](https://github.com/graphql/graphiql/commit/8be164b1e158d00752d6d3f30630a797d07d08c9), [`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e), [`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e)]:
  - @graphiql/toolkit@0.6.0

## 0.1.2

### Patch Changes

- [#2427](https://github.com/graphql/graphiql/pull/2427) [`ebc864f0`](https://github.com/graphql/graphiql/commit/ebc864f0ab05000758cb2898daaa73a2f15255ec) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Mark `graphql` as external dependency to avoid importing multiple instances

* [#2427](https://github.com/graphql/graphiql/pull/2427) [`ebc864f0`](https://github.com/graphql/graphiql/commit/ebc864f0ab05000758cb2898daaa73a2f15255ec) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix linting by also updating the options object in the internal codemirror state

## 0.1.1

### Patch Changes

- [#2423](https://github.com/graphql/graphiql/pull/2423) [`838e58da`](https://github.com/graphql/graphiql/commit/838e58dad652d8f5559af7b88d049b1c62348f2f) Thanks [@chentsulin](https://github.com/chentsulin)! - Fix peer dependency declaration by using `||` instead of `|` to link multiple major versions

## 0.1.0

### Minor Changes

- [#2409](https://github.com/graphql/graphiql/pull/2409) [`f2025ba0`](https://github.com/graphql/graphiql/commit/f2025ba06c5aa8e8ac68d29538ff135f3efc8e46) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic of the variable editor from the `graphiql` package into a hook `useVariableEditor` provided by `@graphiql/react`

* [#2408](https://github.com/graphql/graphiql/pull/2408) [`d825bb75`](https://github.com/graphql/graphiql/commit/d825bb7569ca6b1ebbe534b893354645c790e003) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic of the query editor from the `graphiql` package into a hook `useQueryEditor` provided by `@graphiql/react`

- [#2411](https://github.com/graphql/graphiql/pull/2411) [`ad448693`](https://github.com/graphql/graphiql/commit/ad4486934ba69247efd33ee500e30f8236ecd079) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic of the result viewer from the `graphiql` package into a hook `useResponseEditor` provided by `@graphiql/react`

* [#2404](https://github.com/graphql/graphiql/pull/2404) [`029ddf82`](https://github.com/graphql/graphiql/commit/029ddf82c29754ab8518ae7df66f9b25361a8247) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a context provider for editors and move the logic of the headers editor from the `graphiql` package into a hook `useHeaderEditor` provided by `@graphiql/react`

### Patch Changes

- [#2370](https://github.com/graphql/graphiql/pull/2370) [`7f695b10`](https://github.com/graphql/graphiql/commit/7f695b104f9b25ba8c6d36f7827c475b297b7482) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a context with provider component and hooks that manages the state related to the docs/explorer.
