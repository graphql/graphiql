# @graphiql/plugin-doc-explorer

## 0.5.0-alpha.0

### Minor Changes

- [#4299](https://github.com/graphql/graphiql/pull/4299) [`b73d951`](https://github.com/graphql/graphiql/commit/b73d9513dffcbb9ad2c3ceebff79208be85c8f6d) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Redesign the Schema Explorer panel: eyebrow header with filter and search icon buttons, dedicated breadcrumb row with color-coded depth segments, inline search row with keycap hint, type card with TYPE badge and implements list, and a mono field list with type colors and active-row accent border.

### Patch Changes

- [#4294](https://github.com/graphql/graphiql/pull/4294) [`92567d5`](https://github.com/graphql/graphiql/commit/92567d51050cad11501c679bae0c9377098345cd) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Restyle to the v6 design. Uses the new `PanelHeader` chrome and OKLCH design tokens. Type names render in `--accent-orange`, field and enum names in `--accent-green-light`, argument names in `--accent-purple`.

- Updated dependencies [[`bbe02de`](https://github.com/graphql/graphiql/commit/bbe02de17c9cbb01ba4dfc23be3b9ed82e9b7055), [`a5fbe57`](https://github.com/graphql/graphiql/commit/a5fbe5702bacc83c5f0b124ddf05707921b710a0), [`dabeb6d`](https://github.com/graphql/graphiql/commit/dabeb6dccba58d4b61c042b6a596f870cf0ce3fb), [`d4f0268`](https://github.com/graphql/graphiql/commit/d4f026853b89b9755f28d8f4059fcba419aa6d5a), [`c25bfd5`](https://github.com/graphql/graphiql/commit/c25bfd5b51ad98f36cbdb81a7486380f8dd1ab6a), [`76a5169`](https://github.com/graphql/graphiql/commit/76a516903250e43096269971fc5ef708bcacce00), [`72e8970`](https://github.com/graphql/graphiql/commit/72e897082bbec4b67a26bf958c6205fefb64aa77), [`f8a9445`](https://github.com/graphql/graphiql/commit/f8a944505a0fbb9245b4ea1a3ca67bd50d4b7991), [`1ce71e4`](https://github.com/graphql/graphiql/commit/1ce71e407dd3b457d6fecc9e7ad0b3ad246c693b), [`3b18277`](https://github.com/graphql/graphiql/commit/3b182772c5922be5cfeb0862bdc4aafb654fbdac), [`a540401`](https://github.com/graphql/graphiql/commit/a5404018b527b644e46cdf5022ffcae4a541af5f), [`03535ab`](https://github.com/graphql/graphiql/commit/03535abc736d4479ac558320c477ff3b2e05b3f5), [`a565cac`](https://github.com/graphql/graphiql/commit/a565cac06241a24c182774ff6e1e88586737fd33), [`0bd32a1`](https://github.com/graphql/graphiql/commit/0bd32a18c06fcca853cfd155538ccf50f6a3fc90), [`bd773d3`](https://github.com/graphql/graphiql/commit/bd773d3a245cd3a6a9e1595f7d2d686e2201c786), [`1bcf3be`](https://github.com/graphql/graphiql/commit/1bcf3be69a883f4eda09713b0db81e738a27e310), [`7dd2111`](https://github.com/graphql/graphiql/commit/7dd211143e2e8c575363dfb8339a37c1452579dd), [`f5968fe`](https://github.com/graphql/graphiql/commit/f5968fed097799df7105fb6e414603020f11bd18), [`05ecaf0`](https://github.com/graphql/graphiql/commit/05ecaf0aae89a027a415f6ab070ba0be204c473a), [`5fb2d64`](https://github.com/graphql/graphiql/commit/5fb2d6487bc3e8cc3c468daf08ef56812e28b0e3), [`34695e8`](https://github.com/graphql/graphiql/commit/34695e832ddcbb23c80a6060fe28cf0127d1d61a), [`e54b9c9`](https://github.com/graphql/graphiql/commit/e54b9c94ab0b61d47731554362c6641a12aa0112), [`a0fe11a`](https://github.com/graphql/graphiql/commit/a0fe11aeb40861b586b4cfa5678b8ebe1bea4a19), [`480afc1`](https://github.com/graphql/graphiql/commit/480afc1933663bcd8982cbc2ab5a585f4e4461d0), [`4fa53a8`](https://github.com/graphql/graphiql/commit/4fa53a8d2f111d9a894c59a7b7c79de8c9089136), [`3f79ce9`](https://github.com/graphql/graphiql/commit/3f79ce94bab865be1bceae2e2596414e3766fc6d), [`6627635`](https://github.com/graphql/graphiql/commit/66276352a63da0a6c9924fcd488296d08e6f3a1b), [`a9f9e4c`](https://github.com/graphql/graphiql/commit/a9f9e4c672fc63611b9a2dc19653e2c78eb57d51), [`82e5460`](https://github.com/graphql/graphiql/commit/82e54602731305d955da5dbf911073f9430fac99), [`093cb10`](https://github.com/graphql/graphiql/commit/093cb100a4524b1005b82c1c064bb897416bfc82), [`fdbd07d`](https://github.com/graphql/graphiql/commit/fdbd07d0c11426ef2095ba6637fb80272dd01a86), [`b77270a`](https://github.com/graphql/graphiql/commit/b77270a74e0ed07cd3c5e614da71f1f631d9c4f6)]:
  - @graphiql/react@0.38.0-alpha.0

## 0.4.2

### Patch Changes

- [#4231](https://github.com/graphql/graphiql/pull/4231) [`6f5d5d2`](https://github.com/graphql/graphiql/commit/6f5d5d25a9c6b3eb1b977bd41b1d9a37b1dceed3) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Fix degraded type declarations in published packages

  Both packages import from `@graphiql/react` at build time but only declared it as a peer dependency. Yarn workspaces topologically orders builds via `dependencies`/`devDependencies`, not `peerDependencies`, so on a clean checkout these plugins built before `@graphiql/react` had emitted its `dist/*.d.ts`. `vite-plugin-dts` then ran `tsc` against unresolved `@graphiql/react` imports, fell back to `any` for any return type that flowed through `useGraphiQL`, and published `.d.ts` artifacts where hooks like `useDocExplorer` and `useDocExplorerActions` resolved to `() => any` instead of their real shapes.

  Adding `@graphiql/react` as a `devDependency` matches the pattern already in `@graphiql/plugin-explorer` and `@graphiql/plugin-code-exporter` and lets the build run in topological order.

- [#4140](https://github.com/graphql/graphiql/pull/4140) [`40359eb`](https://github.com/graphql/graphiql/commit/40359ebbf3acf0a9968d4cb83c57167be1b1b38a) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Remove `react-compiler-runtime` peer dependency

- [#4211](https://github.com/graphql/graphiql/pull/4211) [`e7b30c1`](https://github.com/graphql/graphiql/commit/e7b30c1ca5d2eeab63f59894515ea25df86331f8) Thanks [@davidjb](https://github.com/davidjb)! - Add \*.css to sideEffects to allow import of CSS in Webpack Javascript

## 0.4.1

### Patch Changes

- Updated dependencies [[`6e5d5fc`](https://github.com/graphql/graphiql/commit/6e5d5fce9a7eb5770f40300fc153e0b9b10edfbf), [`293beed`](https://github.com/graphql/graphiql/commit/293beed772baa2be834cad5f19e1aee0628e15cc)]:
  - @graphiql/react@0.37.0

## 0.4.0

### Minor Changes

- [#4074](https://github.com/graphql/graphiql/pull/4074) [`fd3f9e6`](https://github.com/graphql/graphiql/commit/fd3f9e6a91be728a69a136ad8680f6e3c7241198) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Ensure `storage` and `theme` store values aren't shared between GraphiQL instances. Deprecate `useTheme` and `useStorage` hooks in favour of values from `useGraphiQL` and `useGraphiQLActions` hooks

  feat(`@graphiql/plugin-history`/`@graphiql/plugin-doc-explorer`): move `@graphiql/react` to `peerDependencies`

- [#4077](https://github.com/graphql/graphiql/pull/4077) [`3d41e11`](https://github.com/graphql/graphiql/commit/3d41e113fbf53930fd1b519b6d1330d0f4b23b7b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - add new example [Usage GraphiQL 5 with Vite, React Router and `ssr: true`](https://github.com/graphql/graphiql/tree/main/examples/example-graphiql-vite-react-router)

### Patch Changes

- Updated dependencies [[`3a0a755`](https://github.com/graphql/graphiql/commit/3a0a75569c6b318f5dc27d62000bcc9b0536c6fd), [`fd3f9e6`](https://github.com/graphql/graphiql/commit/fd3f9e6a91be728a69a136ad8680f6e3c7241198), [`416e3a0`](https://github.com/graphql/graphiql/commit/416e3a05e9473eb2abd444da61ecfb8614020d14), [`3d41e11`](https://github.com/graphql/graphiql/commit/3d41e113fbf53930fd1b519b6d1330d0f4b23b7b)]:
  - @graphiql/react@0.36.0

## 0.3.0

### Minor Changes

- [#3990](https://github.com/graphql/graphiql/pull/3990) [`27e7eb6`](https://github.com/graphql/graphiql/commit/27e7eb60247437d992c1fcdcc6870cb7892d4b92) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - allow multiple independent instances of GraphiQL on the same page
  - store `onClickReference` in query editor in React `ref`
  - remove `onClickReference` from variable editor
  - fix shortcut text per OS for run query in execute query button's tooltip and in default query
  - allow override all default GraphiQL plugins
  - adjust operation argument color to be purple from GraphiQL v2 on dark/light theme

- [#4009](https://github.com/graphql/graphiql/pull/4009) [`4936492`](https://github.com/graphql/graphiql/commit/49364924d0da05a86f7c6c3139d44aed0e474531) Thanks [@dimaMachina](https://github.com/dimaMachina)! - separate store actions from state, add `useGraphiQLActions` state

- [#4025](https://github.com/graphql/graphiql/pull/4025) [`6a50740`](https://github.com/graphql/graphiql/commit/6a507407c7c63bfc779ad383054ab3a8c003ef5b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - set "importsNotUsedAsValues": "error" in tsconfig

- [#3234](https://github.com/graphql/graphiql/pull/3234) [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Migration from Codemirror to [Monaco Editor](https://github.com/microsoft/monaco-editor)

  Replacing `codemirror-graphql` with [`monaco-graphql`](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)

  Support for comments in **Variables** and **Headers** editors

- [#4026](https://github.com/graphql/graphiql/pull/4026) [`7fb5ac3`](https://github.com/graphql/graphiql/commit/7fb5ac38b8ec27f0234adc06aacf42e71f6a259b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - deprecate `useExplorerContext`, `useHistoryContext`, `usePrettifyEditors`, `useCopyQuery`, `useMergeQuery`, `useExecutionContext`, `usePluginContext`, `useSchemaContext`, `useStorageContext` hooks
  - fix response editor overflow on `<GraphiQL.Footer />`
  - export `GraphiQLProps` type
  - allow `children: ReactNode` for `<GraphiQL.Toolbar />`
  - change `ToolbarMenu` component:
    - The `label` and `className` props were removed
    - The `button` prop should now be a button element
  - document `useGraphiQL` and `useGraphiQLActions` hooks in `@graphiql/react` README.md
  - rename `useThemeStore` to `useTheme`

- [#3950](https://github.com/graphql/graphiql/pull/3950) [`2455907`](https://github.com/graphql/graphiql/commit/245590708cea52ff6f1bcce8664781f7e56029cb) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - remove `useQueryEditor`, `useVariableEditor`, `useHeaderEditor`, `useResponseEditor` hooks
  - remove `UseHeaderEditorArgs`, `UseQueryEditorArgs`, `UseResponseEditorArgs`, `UseVariableEditorArgs` exports
  - rename components
    - `StorageContextProvider` => `StorageStore`
    - `EditorContextProvider` => `EditorStore`
    - `SchemaContextProvider` => `SchemaStore`
    - `ExecutionContextProvider` => `ExecutionStore`
    - `HistoryContextProvider` => `HistoryStore`
    - `ExplorerContextProvider` => `ExplorerStore`

### Patch Changes

- [#3949](https://github.com/graphql/graphiql/pull/3949) [`0844dc1`](https://github.com/graphql/graphiql/commit/0844dc1ca89a5d8fce0dc23658cca6987ff8443e) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - replace `onCopyQuery` hook with `copyQuery` function
  - replace `onMergeQuery` hook with `mergeQuery` function
  - replace `onPrettifyEditors` hook with `prettifyEditors` function
  - remove `fetcher` prop from `SchemaContextProvider` and `schemaStore` and add `fetcher` to `executionStore`
  - add `onCopyQuery` and `onPrettifyQuery` props to `EditorContextProvider`
  - remove exports (use `GraphiQLProvider`)
    - `EditorContextProvider`
    - `ExecutionContextProvider`
    - `PluginContextProvider`
    - `SchemaContextProvider`
    - `StorageContextProvider`
    - `ExecutionContextType`
    - `PluginContextType`
  - feat(@graphiql/react): migrate React context to zustand:
    - replace `useExecutionContext` with `useExecutionStore` hook
    - replace `useEditorContext` with `useEditorStore` hook
  - prefer `getComputedStyle` over `window.getComputedStyle`

- [#4006](https://github.com/graphql/graphiql/pull/4006) [`7792dc9`](https://github.com/graphql/graphiql/commit/7792dc98814abcd6dc5f5cd94ae84c308a260dcf) Thanks [@dimaMachina](https://github.com/dimaMachina)! - push field type on stack too before field

- [#4007](https://github.com/graphql/graphiql/pull/4007) [`f9780bd`](https://github.com/graphql/graphiql/commit/f9780bd44f67acad0a9bb10f57eb6059db60e1ec) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Use an additional `Alt` key for focus doc explorer search input instead of `Cmd/Ctrl+K` because monaco-editor has a built-in shortcut for `Cmd/Ctrl+K`

- [#4004](https://github.com/graphql/graphiql/pull/4004) [`16fdd6a`](https://github.com/graphql/graphiql/commit/16fdd6a16684c9f250ee53ea2dfbb24435cee6a9) Thanks [@dimaMachina](https://github.com/dimaMachina)! - show spinner in doc explorer based on `isIntrospecting` value, and not based on `isFetching`

- Updated dependencies [[`27e7eb6`](https://github.com/graphql/graphiql/commit/27e7eb60247437d992c1fcdcc6870cb7892d4b92), [`0844dc1`](https://github.com/graphql/graphiql/commit/0844dc1ca89a5d8fce0dc23658cca6987ff8443e), [`866a8f3`](https://github.com/graphql/graphiql/commit/866a8f39a27d213315ccc55ec06353bb3280b270), [`4936492`](https://github.com/graphql/graphiql/commit/49364924d0da05a86f7c6c3139d44aed0e474531), [`3c0ad34`](https://github.com/graphql/graphiql/commit/3c0ad34a8f2f9d0f912db9597f608d7405c2bd83), [`1e3ec84`](https://github.com/graphql/graphiql/commit/1e3ec8455706e62e6cae306df58d3343ec6b612d), [`0c8e390`](https://github.com/graphql/graphiql/commit/0c8e3906cf58055f898cb173b2e912a494ae8439), [`0a08642`](https://github.com/graphql/graphiql/commit/0a0864268da4f340e30a1e9b8191d34e33ffbfa7), [`cff3da5`](https://github.com/graphql/graphiql/commit/cff3da541184d36d1c2e5c919dd4231e9905ccbb), [`6a50740`](https://github.com/graphql/graphiql/commit/6a507407c7c63bfc779ad383054ab3a8c003ef5b), [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91), [`30bc3f9`](https://github.com/graphql/graphiql/commit/30bc3f9cae4dbb11649a0952dad092e192ad653c), [`4b39f11`](https://github.com/graphql/graphiql/commit/4b39f1118d008c2fac6e2df9c94a3f3271c4eeb9), [`7fb5ac3`](https://github.com/graphql/graphiql/commit/7fb5ac38b8ec27f0234adc06aacf42e71f6a259b), [`2455907`](https://github.com/graphql/graphiql/commit/245590708cea52ff6f1bcce8664781f7e56029cb)]:
  - @graphiql/react@0.35.0

## 0.3.0-rc.4

### Minor Changes

- [#4025](https://github.com/graphql/graphiql/pull/4025) [`6a50740`](https://github.com/graphql/graphiql/commit/6a507407c7c63bfc779ad383054ab3a8c003ef5b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - set "importsNotUsedAsValues": "error" in tsconfig

- [#4026](https://github.com/graphql/graphiql/pull/4026) [`7fb5ac3`](https://github.com/graphql/graphiql/commit/7fb5ac38b8ec27f0234adc06aacf42e71f6a259b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - deprecate `useExplorerContext`, `useHistoryContext`, `usePrettifyEditors`, `useCopyQuery`, `useMergeQuery`, `useExecutionContext`, `usePluginContext`, `useSchemaContext`, `useStorageContext` hooks
  - fix response editor overflow on `<GraphiQL.Footer />`
  - export `GraphiQLProps` type
  - allow `children: ReactNode` for `<GraphiQL.Toolbar />`
  - change `ToolbarMenu` component:
    - The `label` and `className` props were removed
    - The `button` prop should now be a button element
  - document `useGraphiQL` and `useGraphiQLActions` hooks in `@graphiql/react` README.md
  - rename `useThemeStore` to `useTheme`

### Patch Changes

- Updated dependencies [[`6a50740`](https://github.com/graphql/graphiql/commit/6a507407c7c63bfc779ad383054ab3a8c003ef5b), [`7fb5ac3`](https://github.com/graphql/graphiql/commit/7fb5ac38b8ec27f0234adc06aacf42e71f6a259b)]:
  - @graphiql/react@0.35.0-rc.8

## 0.3.0-rc.3

### Minor Changes

- [#4009](https://github.com/graphql/graphiql/pull/4009) [`4936492`](https://github.com/graphql/graphiql/commit/49364924d0da05a86f7c6c3139d44aed0e474531) Thanks [@dimaMachina](https://github.com/dimaMachina)! - separate store actions from state, add `useGraphiQLActions` state

### Patch Changes

- Updated dependencies [[`4936492`](https://github.com/graphql/graphiql/commit/49364924d0da05a86f7c6c3139d44aed0e474531)]:
  - @graphiql/react@0.35.0-rc.3

## 0.3.0-rc.2

### Patch Changes

- [#4006](https://github.com/graphql/graphiql/pull/4006) [`7792dc9`](https://github.com/graphql/graphiql/commit/7792dc98814abcd6dc5f5cd94ae84c308a260dcf) Thanks [@dimaMachina](https://github.com/dimaMachina)! - push field type on stack too before field

- [#4007](https://github.com/graphql/graphiql/pull/4007) [`f9780bd`](https://github.com/graphql/graphiql/commit/f9780bd44f67acad0a9bb10f57eb6059db60e1ec) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Use an additional `Alt` key for focus doc explorer search input instead of `Cmd/Ctrl+K` because monaco-editor has a built-in shortcut for `Cmd/Ctrl+K`

- [#4004](https://github.com/graphql/graphiql/pull/4004) [`16fdd6a`](https://github.com/graphql/graphiql/commit/16fdd6a16684c9f250ee53ea2dfbb24435cee6a9) Thanks [@dimaMachina](https://github.com/dimaMachina)! - show spinner in doc explorer based on `isIntrospecting` value, and not based on `isFetching`

- Updated dependencies [[`866a8f3`](https://github.com/graphql/graphiql/commit/866a8f39a27d213315ccc55ec06353bb3280b270), [`1e3ec84`](https://github.com/graphql/graphiql/commit/1e3ec8455706e62e6cae306df58d3343ec6b612d), [`0c8e390`](https://github.com/graphql/graphiql/commit/0c8e3906cf58055f898cb173b2e912a494ae8439)]:
  - @graphiql/react@0.35.0-rc.2

## 0.3.0-rc.1

### Minor Changes

- [#3990](https://github.com/graphql/graphiql/pull/3990) [`27e7eb6`](https://github.com/graphql/graphiql/commit/27e7eb60247437d992c1fcdcc6870cb7892d4b92) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - allow multiple independent instances of GraphiQL on the same page
  - store `onClickReference` in query editor in React `ref`
  - remove `onClickReference` from variable editor
  - fix shortcut text per OS for run query in execute query button's tooltip and in default query
  - allow override all default GraphiQL plugins
  - adjust operation argument color to be purple from GraphiQL v2 on dark/light theme

### Patch Changes

- Updated dependencies [[`27e7eb6`](https://github.com/graphql/graphiql/commit/27e7eb60247437d992c1fcdcc6870cb7892d4b92)]:
  - @graphiql/react@0.35.0-rc.1

## 0.3.0-rc.0

### Minor Changes

- [#3234](https://github.com/graphql/graphiql/pull/3234) [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Migration from Codemirror to [Monaco Editor](https://github.com/microsoft/monaco-editor)

  Replacing `codemirror-graphql` with [`monaco-graphql`](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)

  Support for comments in **Variables** and **Headers** editors

- [#3950](https://github.com/graphql/graphiql/pull/3950) [`2455907`](https://github.com/graphql/graphiql/commit/245590708cea52ff6f1bcce8664781f7e56029cb) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - remove `useQueryEditor`, `useVariableEditor`, `useHeaderEditor`, `useResponseEditor` hooks
  - remove `UseHeaderEditorArgs`, `UseQueryEditorArgs`, `UseResponseEditorArgs`, `UseVariableEditorArgs` exports
  - rename components
    - `StorageContextProvider` => `StorageStore`
    - `EditorContextProvider` => `EditorStore`
    - `SchemaContextProvider` => `SchemaStore`
    - `ExecutionContextProvider` => `ExecutionStore`
    - `HistoryContextProvider` => `HistoryStore`
    - `ExplorerContextProvider` => `ExplorerStore`

### Patch Changes

- [#3949](https://github.com/graphql/graphiql/pull/3949) [`0844dc1`](https://github.com/graphql/graphiql/commit/0844dc1ca89a5d8fce0dc23658cca6987ff8443e) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - replace `onCopyQuery` hook with `copyQuery` function
  - replace `onMergeQuery` hook with `mergeQuery` function
  - replace `onPrettifyEditors` hook with `prettifyEditors` function
  - remove `fetcher` prop from `SchemaContextProvider` and `schemaStore` and add `fetcher` to `executionStore`
  - add `onCopyQuery` and `onPrettifyQuery` props to `EditorContextProvider`
  - remove exports (use `GraphiQLProvider`)
    - `EditorContextProvider`
    - `ExecutionContextProvider`
    - `PluginContextProvider`
    - `SchemaContextProvider`
    - `StorageContextProvider`
    - `ExecutionContextType`
    - `PluginContextType`
  - feat(@graphiql/react): migrate React context to zustand:
    - replace `useExecutionContext` with `useExecutionStore` hook
    - replace `useEditorContext` with `useEditorStore` hook
  - prefer `getComputedStyle` over `window.getComputedStyle`
- Updated dependencies [[`0844dc1`](https://github.com/graphql/graphiql/commit/0844dc1ca89a5d8fce0dc23658cca6987ff8443e), [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91), [`2455907`](https://github.com/graphql/graphiql/commit/245590708cea52ff6f1bcce8664781f7e56029cb)]:
  - @graphiql/react@0.35.0-rc.0

## 0.2.2

### Patch Changes

- [#3970](https://github.com/graphql/graphiql/pull/3970) [`7054591`](https://github.com/graphql/graphiql/commit/70545912d1b3bb9e0c45e766a5c89896a9c4dfb7) Thanks [@dimaMachina](https://github.com/dimaMachina)! - revert https://github.com/graphql/graphiql/pull/3946 to have support multiple embedded graphiql instances on the same page

- Updated dependencies [[`7054591`](https://github.com/graphql/graphiql/commit/70545912d1b3bb9e0c45e766a5c89896a9c4dfb7)]:
  - @graphiql/react@0.34.1

## 0.2.1

### Patch Changes

- [#3946](https://github.com/graphql/graphiql/pull/3946) [`71755b7`](https://github.com/graphql/graphiql/commit/71755b7f412f8f3dd9f5194d3f1e0168b9ad07af) Thanks [@dimaMachina](https://github.com/dimaMachina)! - feat(@graphiql/react): migrate React context to zustand:
  - replace `useExecutionContext` with `useExecutionStore` hook
  - replace `useEditorContext` with `useEditorStore` hook
  - replace `useAutoCompleteLeafs` hook with `getAutoCompleteLeafs` function
- Updated dependencies [[`71755b7`](https://github.com/graphql/graphiql/commit/71755b7f412f8f3dd9f5194d3f1e0168b9ad07af), [`6d631e2`](https://github.com/graphql/graphiql/commit/6d631e2e558d038476fe235b1506bc52ecf68781)]:
  - @graphiql/react@0.34.0

## 0.2.0

### Minor Changes

- [#3947](https://github.com/graphql/graphiql/pull/3947) [`fa78481`](https://github.com/graphql/graphiql/commit/fa784819ce020346052901019079fb5b44af6ef0) Thanks [@dimaMachina](https://github.com/dimaMachina)! - refactor `useStorage`, `useDocExplorer` and `useHistory` hooks

### Patch Changes

- [#3945](https://github.com/graphql/graphiql/pull/3945) [`117627b`](https://github.com/graphql/graphiql/commit/117627b451607198dd7b9dc19e76da8a71d14b71) Thanks [@dimaMachina](https://github.com/dimaMachina)! - feat(@graphiql/react): migrate React context to zustand, replace `usePluginContext` with `usePluginStore` hook

- [#3943](https://github.com/graphql/graphiql/pull/3943) [`7275472`](https://github.com/graphql/graphiql/commit/727547236bbd4fc721069ceae63eb8a6acffa57e) Thanks [@dimaMachina](https://github.com/dimaMachina)! - feat(@graphiql/react): migrate React context to zustand, replace `useSchemaContext` with `useSchemaStore` hook

- Updated dependencies [[`117627b`](https://github.com/graphql/graphiql/commit/117627b451607198dd7b9dc19e76da8a71d14b71), [`fa78481`](https://github.com/graphql/graphiql/commit/fa784819ce020346052901019079fb5b44af6ef0), [`7275472`](https://github.com/graphql/graphiql/commit/727547236bbd4fc721069ceae63eb8a6acffa57e), [`00c8605`](https://github.com/graphql/graphiql/commit/00c8605e1f3068e6547a5a9e969571a86a57f921)]:
  - @graphiql/react@0.33.0

## 0.1.0

### Minor Changes

- [#3940](https://github.com/graphql/graphiql/pull/3940) [`5a66864`](https://github.com/graphql/graphiql/commit/5a668647e1cbca9e846bfa617f97fbae21c821bd) Thanks [@dimaMachina](https://github.com/dimaMachina)! - feat(@graphiql/plugin-doc-explorer): migrate React context to zustand, replace `useExplorerContext` with `useDocExplorer` and `useDocExplorerActions` hooks

## 0.0.2

### Patch Changes

- [#3939](https://github.com/graphql/graphiql/pull/3939) [`69ad489`](https://github.com/graphql/graphiql/commit/69ad489678d0096432d5c4b1749d87343f4ed1f7) Thanks [@dimaMachina](https://github.com/dimaMachina)! - prefer `React.FC` type when declaring React components

- Updated dependencies [[`2bfbb06`](https://github.com/graphql/graphiql/commit/2bfbb06e416cabc46951a137b61a12a571f0c937), [`69ad489`](https://github.com/graphql/graphiql/commit/69ad489678d0096432d5c4b1749d87343f4ed1f7), [`2500288`](https://github.com/graphql/graphiql/commit/250028863f6eefe4167ff9f9c23168ccf0a85b7b)]:
  - @graphiql/react@0.32.2

## 0.0.1

### Patch Changes

- [#3916](https://github.com/graphql/graphiql/pull/3916) [`98d13a3`](https://github.com/graphql/graphiql/commit/98d13a3e515eb70aaf5a5ba669c680d5959fef67) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - remove the following exports from `@graphiql/react` and move them in `@graphiql/plugin-doc-explorer` package:
  - Argument
  - DefaultValue
  - DeprecationReason
  - Directive
  - DocExplorer
  - ExplorerContext
  - ExplorerContextProvider
  - ExplorerSection
  - FieldDocumentation
  - FieldLink
  - SchemaDocumentation
  - Search
  - TypeDocumentation
  - TypeLink
  - useExplorerContext
  - DOC_EXPLORER_PLUGIN
  - ExplorerContextType
  - ExplorerFieldDef
  - ExplorerNavStack
  - ExplorerNavStackItem
  - add new `referencePlugin` prop on `PluginContextProviderProps` component for plugin which is used to display the reference documentation when selecting a type.

- Updated dependencies [[`98d13a3`](https://github.com/graphql/graphiql/commit/98d13a3e515eb70aaf5a5ba669c680d5959fef67)]:
  - @graphiql/react@0.32.0
