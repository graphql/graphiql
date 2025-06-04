---
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-explorer': patch
'@graphiql/plugin-history': patch
'codemirror-graphql': patch
'@graphiql/react': minor
'graphiql': patch
---

- replace `onCopyQuery` hook with `copyQuery` function
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
