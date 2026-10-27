---
'@graphiql/react': major
'@graphiql/plugin-doc-explorer': major
'@graphiql/plugin-history': major
---

Remove deprecated hooks: `useEditorContext`, `useExecutionContext`, `usePluginContext`, `useSchemaContext`, `useTheme`, `useStorage`, `useStorageContext`, `usePrettifyEditors`, `useCopyQuery`, `useMergeQuery`, the `*Store` aliases (in `@graphiql/react`); `useExplorerContext` (in `@graphiql/plugin-doc-explorer`); and `useHistoryContext` (in `@graphiql/plugin-history`). Replacements were available since v5 — see the v6 migration guide for one-line replacements.
