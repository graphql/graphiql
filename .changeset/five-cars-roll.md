---
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-explorer': patch
'@graphiql/plugin-history': patch
'@graphiql/react': minor
'graphiql': patch
---

feat(@graphiql/react): migrate React context to zustand:
  - replace `useExecutionContext` with `useExecutionStore` hook
  - replace `useEditorContext` with `useEditorStore` hook
  - replace `useAutoCompleteLeafs` hook with `getAutoCompleteLeafs` function
