---
'@graphiql/plugin-history': patch
'@graphiql/react': minor
'graphiql': patch
---

- export `cn` from `@graphiql/react`

- extract `HistoryContextProvider` from `@graphiql/react` and publish as `@graphiql/plugin-history` package

- remove exports from `@graphiql/react`:
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
