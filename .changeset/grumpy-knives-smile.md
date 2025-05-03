---
'@graphiql/plugin-history': patch
'@graphiql/react': minor
'graphiql': patch
---

- export `cn` from `@graphiql/react`


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
