# @graphiql/react

## 0.13.7

### Patch Changes

- Updated dependencies [[`20869583`](https://github.com/graphql/graphiql/commit/20869583eff563f5d6494e93302a835f0e034f4b)]:
  - codemirror-graphql@2.0.2

## 0.13.6

### Patch Changes

- Updated dependencies [[`353f434e`](https://github.com/graphql/graphiql/commit/353f434e5f6bfd1bf6f8ee97d4ae8ce4f897085f)]:
  - codemirror-graphql@2.0.1

## 0.13.5

### Patch Changes

- [#2839](https://github.com/graphql/graphiql/pull/2839) [`682ad06e`](https://github.com/graphql/graphiql/commit/682ad06e58ded2f82fa973e8e6613dd654417fe2) Thanks [@ClemensSahs](https://github.com/ClemensSahs)! - Export the `PluginContextProvider` component

## 0.13.4

### Patch Changes

- [#2824](https://github.com/graphql/graphiql/pull/2824) [`4e2f7ff9`](https://github.com/graphql/graphiql/commit/4e2f7ff99c578ceae54a1ae17c02088bd91b89c3) Thanks [@TheMightyPenguin](https://github.com/TheMightyPenguin)! - fix: prevent key down events when pressing escape to close autocomplete dialogs

## 0.13.3

### Patch Changes

- [#2791](https://github.com/graphql/graphiql/pull/2791) [`42700076`](https://github.com/graphql/graphiql/commit/4270007671ce52f6c2250739916083611748b657) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make sure that the info overlay in editors is shown above the vertical scrollbar

* [#2792](https://github.com/graphql/graphiql/pull/2792) [`36839800`](https://github.com/graphql/graphiql/commit/36839800de128b05d11c262036c8240390c72a14) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid resetting visible plugin state when explorer or history context changes

- [#2778](https://github.com/graphql/graphiql/pull/2778) [`905f2e5e`](https://github.com/graphql/graphiql/commit/905f2e5ea3f0b304d27ea583e250ed4baff5016e) Thanks [@jonathanawesome](https://github.com/jonathanawesome)! - Adds a box-model reset for all children of the `.graphiql-container` class. This change facilitated another change to the `--sidebar-width` variable.

## 0.13.2

### Patch Changes

- [#2653](https://github.com/graphql/graphiql/pull/2653) [`39b4668d`](https://github.com/graphql/graphiql/commit/39b4668d43176526d37ecf07d8c86901d53e0d80) Thanks [@dylanowen](https://github.com/dylanowen)! - Fix `fetchError` not being cleared when a new `fetcher` is used

## 0.13.1

### Patch Changes

- Updated dependencies [[`e244b782`](https://github.com/graphql/graphiql/commit/e244b78291c2e2bb02d5753db82437926ebb4df4)]:
  - @graphiql/toolkit@0.8.0

## 0.13.0

### Minor Changes

- [#2735](https://github.com/graphql/graphiql/pull/2735) [`ca067d88`](https://github.com/graphql/graphiql/commit/ca067d88148c5d221d196790a997ad599038fad1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add CSS variables for color alpha values:
  - `--alpha-secondary`: A color for supplementary text that should be read but not be the main focus
  - `--alpha-tertiary`: A color for supplementary text which is optional to read, i.e. the UI would function without the user reading this text
  - `--alpha-background-light`, `--alpha-background-medium` and `--alpha-background-heavy`: Three alpha values used for backgrounds and borders that have different intensity

### Patch Changes

- [#2757](https://github.com/graphql/graphiql/pull/2757) [`32a70065`](https://github.com/graphql/graphiql/commit/32a70065434eaa7733e28cda0ea0e7d51952e62a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Use different colors for field names and argument names

- Updated dependencies [[`674bf3f8`](https://github.com/graphql/graphiql/commit/674bf3f8ff321dfb8471b0f6e5419bb77ddc94af)]:
  - @graphiql/toolkit@0.7.3

## 0.12.1

### Patch Changes

- Updated dependencies [[`bfa90f24`](https://github.com/graphql/graphiql/commit/bfa90f249be4f68049c1bb81abfb524ae623313f), [`8ab5fcd0`](https://github.com/graphql/graphiql/commit/8ab5fcd0a8399a0f8eb1b569751dd0e8390b9679)]:
  - @graphiql/toolkit@0.7.2

## 0.12.0

### Minor Changes

- [#2739](https://github.com/graphql/graphiql/pull/2739) [`98e14155`](https://github.com/graphql/graphiql/commit/98e14155c650ee7c5ac639e594eb47f0052b7fa9) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add `DocsFilledIcon` component and use show that icon in the sidebar when the docs plugin is visible

### Patch Changes

- [#2740](https://github.com/graphql/graphiql/pull/2740) [`7dfea94a`](https://github.com/graphql/graphiql/commit/7dfea94afc0cfe79b5080f10d840bfdce53f02d7) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make SVG icon `stroke-width` consistent

* [#2734](https://github.com/graphql/graphiql/pull/2734) [`3aa1f39f`](https://github.com/graphql/graphiql/commit/3aa1f39f6df559b54f703937ed510c8ba1f21058) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Stop propagating keyboard events too far upwards in the search component for the docs

- [#2741](https://github.com/graphql/graphiql/pull/2741) [`0219eef3`](https://github.com/graphql/graphiql/commit/0219eef39146495749aca2487112db52fa3bb8fd) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add hover styles for buttons

- Updated dependencies [[`48872a87`](https://github.com/graphql/graphiql/commit/48872a87e6edec0c301102baaf669ffcce043a13)]:
  - @graphiql/toolkit@0.7.1

## 0.11.1

### Patch Changes

- [#2712](https://github.com/graphql/graphiql/pull/2712) [`d65f00ea`](https://github.com/graphql/graphiql/commit/d65f00ea2d158cf532d1c71844630c5d9ec13410) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make sure the back link and title are hidden when focussing the input field for searching the docs

* [#2708](https://github.com/graphql/graphiql/pull/2708) [`f15ee38d`](https://github.com/graphql/graphiql/commit/f15ee38d56e4f749c145e0a17f0ed8e9a6096ac2) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix computing the initial state for editor values and tabs to avoid duplicating tabs on page reload

- [#2712](https://github.com/graphql/graphiql/pull/2712) [`d65f00ea`](https://github.com/graphql/graphiql/commit/d65f00ea2d158cf532d1c71844630c5d9ec13410) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make sure hidden editors don't overflow

## 0.11.0

### Minor Changes

- [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - BREAKING: The `onHasCompletion` export has been removed as it is only meant to be used internally.

* [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - Add new components:
  - UI components (`Button`, `ButtonGroup`, `Dialog`, `Menu`, `Spinner`, `Tab`, `Tabs`, `Tooltip`, `UnStyledButton` and lots of icon components)
  - Editor components (`QueryEditor`, `VariableEditor`, `HeaderEditor` and `ResponseEditor`)
  - Toolbar components (`ExecuteButton`, `ToolbarButton`, `ToolbarMenu` and `ToolbarSelect`)
  - Docs components (`Argument`, `DefaultValue`, `DeprecationReason`, `Directive`, `DocExplorer`, `ExplorerSection`, `FieldDocumentation`, `FieldLink`, `SchemaDocumentation`, `Search`, `TypeDocumentation` and `TypeLink`)
  - `History` component
  - A `GraphiQLProvider` component that renders all other existing provider components from `@graphiql/react` for ease of use

- [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - BREAKING: Add a new context provider for plugins. This induces changes to the following other contexts and their provider components:
  - The property `isVisible` and the methods `hide` and `show` of the `ExplorerContext` have been removed. Also, the property `isVisible` and the methods `hide`, `show` and `toggle` of the `HistoryContext` have been removed. Visibility state of plugins is now part of the `PluginContext` using the `visiblePlugin` property. The visibility state can be altered using the `setVisiblePlugin` method of the `PluginContext`.
  - The `isVisible` prop of the `ExplorerContextProvider` has been removed. For controlling the visibility state of plugins you can now use the `visiblePlugin` prop of the `PluginContextProvider`.
  - The `onToggle` prop of the `HistoryContextProvider` and the `onToggleVisibility` prop of the `ExplorerContextProvider` have been removed. For listening on visibility changes for any plugin you can now use the `onTogglePluginVisibility` prop of the `PluginContextProvider`.

* [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - BREAKING: The `ResponseTooltip` prop of the `ResponseEditor` has been renamed to `responseTooltip`

### Patch Changes

- Updated dependencies [[`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279), [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279), [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279)]:
  - codemirror-graphql@2.0.0
  - @graphiql/toolkit@0.7.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`d6ff4d7a`](https://github.com/graphql/graphiql/commit/d6ff4d7a5d535a0c43fe5914016bac9ef0c2b782)]:
  - graphql-language-service@5.1.0
  - codemirror-graphql@1.3.3

## 0.10.0

### Minor Changes

- [#2651](https://github.com/graphql/graphiql/pull/2651) [`85d5af25`](https://github.com/graphql/graphiql/commit/85d5af25d77c29b7d02da90a431c8c15f610c22a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The following context properties have been removed as they are only meant for internal use:
  - The `subscription` property of the `ExecutionContext`
  - The `setSchema` method of the `SchemaContext`
  - The `setFetchError` method of the `SchemaContext`

* [#2652](https://github.com/graphql/graphiql/pull/2652) [`6ff0bab9`](https://github.com/graphql/graphiql/commit/6ff0bab978d63778b8ab4ba6e79fceb36c2db87f) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The `validationErrors` property of the `SchemaContext` is now always non-null. If the schema is valid then it will contain an empty list.

- [#2644](https://github.com/graphql/graphiql/pull/2644) [`0aff68a6`](https://github.com/graphql/graphiql/commit/0aff68a645cceb6b9689e0f394e8bece01710efc) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The `ResponseEditor` component no longer accepts the prop `value`. Instead you can now pass the prop `response` to the `EditorContextProvider`. This aligns it with the API design of the other editor components.

## 0.9.0

### Minor Changes

- [#2642](https://github.com/graphql/graphiql/pull/2642) [`100af928`](https://github.com/graphql/graphiql/commit/100af9284de18ca89524c646e86854313c5d067b) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a new prop `operationName` to the `ExecutionContextProvider` component that controls the operation sent with the request

* [#2642](https://github.com/graphql/graphiql/pull/2642) [`100af928`](https://github.com/graphql/graphiql/commit/100af9284de18ca89524c646e86854313c5d067b) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The `ExecutionContextProvider` and `QueryEditor` components no longer accepts the `onEditOperationName` prop. Instead you can now pass this prop to the `EditorContextProvider` component.

## 0.8.0

### Minor Changes

- [#2636](https://github.com/graphql/graphiql/pull/2636) [`62317e0b`](https://github.com/graphql/graphiql/commit/62317e0bae6d4ccf89d9e1e6607fd8feeb100078) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING:
  - The `ExecutionContextProvider` and `QueryEditor` components no longer accept the `externalFragments` prop. Instead the prop can now be passed to the `EditorContextProvider` component. The provider component will normalize the prop value and provide a map of type `Map<string, FragmentDefinitionNode>` (using the fragment names as keys) as part of the value of the `EditorContext`.
  - The `QueryEditor` component no longer accept the `validationRules` prop. Instead the prop can now be passed to the `EditorContextProvider` component. The provider component will provide the list of validation rules (empty if there are none) as part of the value of the `EditorContext`.
  - The `ExecutionContextProvider` and `HeaderEditor` components no longer accept the `shouldPersistHeaders` prop. Instead the `EditorContextProvider` component now provides the value of its equally named prop as part of the value of the `EditorContext`.

## 0.7.1

### Patch Changes

- Updated dependencies [[`ea732ea8`](https://github.com/graphql/graphiql/commit/ea732ea8e12272c998f1467af8b3b88b6b508e12)]:
  - @graphiql/toolkit@0.6.1

## 0.7.0

### Minor Changes

- [#2618](https://github.com/graphql/graphiql/pull/2618) [`4c814506`](https://github.com/graphql/graphiql/commit/4c814506183579b78731659d871cd4b0ba93305a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a method `introspect` to the schema context and provide a short key (`Shift-Ctrl-R`) for triggering introspection

## 0.6.0

### Minor Changes

- [#2574](https://github.com/graphql/graphiql/pull/2574) [`0c98fa59`](https://github.com/graphql/graphiql/commit/0c98fa5924eadaee33713ccd8a9be6419d50cab1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Allow passing introspection data to the `schema` prop of the `SchemaContextProvider` component

### Patch Changes

- [#2574](https://github.com/graphql/graphiql/pull/2574) [`0c98fa59`](https://github.com/graphql/graphiql/commit/0c98fa5924eadaee33713ccd8a9be6419d50cab1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Set the schema correctly after refetching introspection (e.g. when the `fetcher` prop changes)

## 0.5.2

### Patch Changes

- [#2565](https://github.com/graphql/graphiql/pull/2565) [`f581b437`](https://github.com/graphql/graphiql/commit/f581b437e5bdab6f3ad817d230ee6d1b410bb591) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Don't invoke editor change callbacks when manually signaling "empty" changes.

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
