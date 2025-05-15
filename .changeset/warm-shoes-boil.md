---
'@graphiql/react': minor
'@graphiql/plugin-history': minor
'@graphiql/plugin-doc-explorer': minor
'graphiql': patch
---

remove `useQueryEditor`, `useVariableEditor`, `useHeaderEditor`, `useResponseEditor` hooks

remove `UseHeaderEditorArgs`, `UseQueryEditorArgs`, `UseResponseEditorArgs`, `UseVariableEditorArgs` exports

rename components

- `StorageContext` => `StorageStore`
- `EditorContext` => `EditorStore`
- `SchemaContext` => `SchemaStore`
- `ExecutionContext` => `ExecutionStore`
- `HistoryContext` => `HistoryStore`
- `ExplorerContext` => `ExplorerStore`
