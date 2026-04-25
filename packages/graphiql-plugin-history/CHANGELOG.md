# @graphiql/plugin-history

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

- [#4025](https://github.com/graphql/graphiql/pull/4025) [`6a50740`](https://github.com/graphql/graphiql/commit/6a507407c7c63bfc779ad383054ab3a8c003ef5b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - set "importsNotUsedAsValues": "error" in tsconfig

- [#4011](https://github.com/graphql/graphiql/pull/4011) [`30bc3f9`](https://github.com/graphql/graphiql/commit/30bc3f9cae4dbb11649a0952dad092e192ad653c) Thanks [@dimaMachina](https://github.com/dimaMachina)! - fix execute query shortcut in query editor, run it even there are no operations in query editor

  fix plugin store, save last opened plugin in storage

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

- [#3234](https://github.com/graphql/graphiql/pull/3234) [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Migration from Codemirror to [Monaco Editor](https://github.com/microsoft/monaco-editor)

  Replacing `codemirror-graphql` with [`monaco-graphql`](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)

  Support for comments in **Variables** and **Headers** editors

- Updated dependencies [[`27e7eb6`](https://github.com/graphql/graphiql/commit/27e7eb60247437d992c1fcdcc6870cb7892d4b92), [`0844dc1`](https://github.com/graphql/graphiql/commit/0844dc1ca89a5d8fce0dc23658cca6987ff8443e), [`866a8f3`](https://github.com/graphql/graphiql/commit/866a8f39a27d213315ccc55ec06353bb3280b270), [`4936492`](https://github.com/graphql/graphiql/commit/49364924d0da05a86f7c6c3139d44aed0e474531), [`3c0ad34`](https://github.com/graphql/graphiql/commit/3c0ad34a8f2f9d0f912db9597f608d7405c2bd83), [`1e3ec84`](https://github.com/graphql/graphiql/commit/1e3ec8455706e62e6cae306df58d3343ec6b612d), [`0c8e390`](https://github.com/graphql/graphiql/commit/0c8e3906cf58055f898cb173b2e912a494ae8439), [`0a08642`](https://github.com/graphql/graphiql/commit/0a0864268da4f340e30a1e9b8191d34e33ffbfa7), [`cff3da5`](https://github.com/graphql/graphiql/commit/cff3da541184d36d1c2e5c919dd4231e9905ccbb), [`6a50740`](https://github.com/graphql/graphiql/commit/6a507407c7c63bfc779ad383054ab3a8c003ef5b), [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91), [`30bc3f9`](https://github.com/graphql/graphiql/commit/30bc3f9cae4dbb11649a0952dad092e192ad653c), [`4b39f11`](https://github.com/graphql/graphiql/commit/4b39f1118d008c2fac6e2df9c94a3f3271c4eeb9), [`7fb5ac3`](https://github.com/graphql/graphiql/commit/7fb5ac38b8ec27f0234adc06aacf42e71f6a259b), [`2455907`](https://github.com/graphql/graphiql/commit/245590708cea52ff6f1bcce8664781f7e56029cb)]:
  - @graphiql/react@0.35.0

## 0.3.0-rc.3

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

## 0.3.0-rc.2

### Minor Changes

- [#4011](https://github.com/graphql/graphiql/pull/4011) [`30bc3f9`](https://github.com/graphql/graphiql/commit/30bc3f9cae4dbb11649a0952dad092e192ad653c) Thanks [@dimaMachina](https://github.com/dimaMachina)! - fix execute query shortcut in query editor, run it even there are no operations in query editor

  fix plugin store, save last opened plugin in storage

### Patch Changes

- Updated dependencies [[`30bc3f9`](https://github.com/graphql/graphiql/commit/30bc3f9cae4dbb11649a0952dad092e192ad653c)]:
  - @graphiql/react@0.35.0-rc.4

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

- [#3234](https://github.com/graphql/graphiql/pull/3234) [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Migration from Codemirror to [Monaco Editor](https://github.com/microsoft/monaco-editor)

  Replacing `codemirror-graphql` with [`monaco-graphql`](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)

  Support for comments in **Variables** and **Headers** editors

- Updated dependencies [[`0844dc1`](https://github.com/graphql/graphiql/commit/0844dc1ca89a5d8fce0dc23658cca6987ff8443e), [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91), [`2455907`](https://github.com/graphql/graphiql/commit/245590708cea52ff6f1bcce8664781f7e56029cb)]:
  - @graphiql/react@0.35.0-rc.0

## 0.2.2

### Patch Changes

- [#3970](https://github.com/graphql/graphiql/pull/3970) [`7054591`](https://github.com/graphql/graphiql/commit/70545912d1b3bb9e0c45e766a5c89896a9c4dfb7) Thanks [@dimaMachina](https://github.com/dimaMachina)! - revert https://github.com/graphql/graphiql/pull/3946 to have support multiple embedded graphiql instances on the same page

- Updated dependencies [[`7054591`](https://github.com/graphql/graphiql/commit/70545912d1b3bb9e0c45e766a5c89896a9c4dfb7)]:
  - @graphiql/toolkit@0.11.3
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

- [#3942](https://github.com/graphql/graphiql/pull/3942) [`00c8605`](https://github.com/graphql/graphiql/commit/00c8605e1f3068e6547a5a9e969571a86a57f921) Thanks [@dimaMachina](https://github.com/dimaMachina)! - feat(@graphiql/react): migrate React context to zustand, replace `useStorageContext` with `useStorage` hook

- Updated dependencies [[`117627b`](https://github.com/graphql/graphiql/commit/117627b451607198dd7b9dc19e76da8a71d14b71), [`fa78481`](https://github.com/graphql/graphiql/commit/fa784819ce020346052901019079fb5b44af6ef0), [`7275472`](https://github.com/graphql/graphiql/commit/727547236bbd4fc721069ceae63eb8a6acffa57e), [`00c8605`](https://github.com/graphql/graphiql/commit/00c8605e1f3068e6547a5a9e969571a86a57f921)]:
  - @graphiql/react@0.33.0

## 0.1.0

### Minor Changes

- [#3935](https://github.com/graphql/graphiql/pull/3935) [`5985e13`](https://github.com/graphql/graphiql/commit/5985e135fcc38a0ce90bf5a5d2cc344ec6b36aab) Thanks [@dimaMachina](https://github.com/dimaMachina)! - feat(@graphiql/plugin-history): migrate React context to zustand, replace `useHistoryContext` with `useHistory`, `useHistoryActions` hooks

### Patch Changes

- [#3939](https://github.com/graphql/graphiql/pull/3939) [`69ad489`](https://github.com/graphql/graphiql/commit/69ad489678d0096432d5c4b1749d87343f4ed1f7) Thanks [@dimaMachina](https://github.com/dimaMachina)! - prefer `React.FC` type when declaring React components

- Updated dependencies [[`2bfbb06`](https://github.com/graphql/graphiql/commit/2bfbb06e416cabc46951a137b61a12a571f0c937), [`69ad489`](https://github.com/graphql/graphiql/commit/69ad489678d0096432d5c4b1749d87343f4ed1f7), [`2500288`](https://github.com/graphql/graphiql/commit/250028863f6eefe4167ff9f9c23168ccf0a85b7b)]:
  - @graphiql/react@0.32.2

## 0.0.2

### Patch Changes

- Updated dependencies [[`98d13a3`](https://github.com/graphql/graphiql/commit/98d13a3e515eb70aaf5a5ba669c680d5959fef67)]:
  - @graphiql/react@0.32.0

## 0.0.1

### Patch Changes

- [#3911](https://github.com/graphql/graphiql/pull/3911) [`e7c436b`](https://github.com/graphql/graphiql/commit/e7c436b329a68981bdbd2b662be94875a546a1d6) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - export `cn` from `@graphiql/react`

  - remove following exports from `@graphiql/react` and move them in `@graphiql/plugin-history` package:
    - `History`
    - `HistoryContext`
    - `HistoryContextType`
    - `HistoryContextProvider`
    - `useHistoryContext`
    - `HISTORY_PLUGIN`
  - remove types from `@graphiql/react` (use `ComponentProps<typeof MyContextProviderProps>` instead):
    - `HistoryContextProviderProps`
    - `ExecutionContextProviderProps`
    - `EditorContextProviderProps`
    - `ExplorerContextProviderProps`
    - `PluginContextProviderProps`
    - `SchemaContextProviderProps`
    - `StorageContextProviderProps`
    - `GraphiQLProviderProps`

- Updated dependencies [[`e7c436b`](https://github.com/graphql/graphiql/commit/e7c436b329a68981bdbd2b662be94875a546a1d6)]:
  - @graphiql/react@0.31.0
