# @graphiql/plugin-history

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
