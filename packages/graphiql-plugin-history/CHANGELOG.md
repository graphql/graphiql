# @graphiql/plugin-history

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
