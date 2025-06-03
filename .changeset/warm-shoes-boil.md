---
'@graphiql/react': minor
'@graphiql/plugin-history': minor
'@graphiql/plugin-doc-explorer': minor
'graphiql': patch
---

- remove `useQueryEditor`, `useVariableEditor`, `useHeaderEditor`, `useResponseEditor` hooks
- remove `UseHeaderEditorArgs`, `UseQueryEditorArgs`, `UseResponseEditorArgs`, `UseVariableEditorArgs` exports
- rename components
  - `StorageContextProvider` => `StorageStore`
  - `EditorContextProvider` => `EditorStore`
  - `SchemaContextProvider` => `SchemaStore`
  - `ExecutionContextProvider` => `ExecutionStore`
  - `HistoryContextProvider` => `HistoryStore`
  - `ExplorerContextProvider` => `ExplorerStore`
