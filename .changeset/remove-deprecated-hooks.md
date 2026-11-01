---
'@graphiql/react': major
'@graphiql/plugin-doc-explorer': major
'@graphiql/plugin-history': major
---

Remove deprecated hooks: `useEditorContext`, `useExecutionContext`, `usePluginContext`, `useSchemaContext`, `useTheme`, `useStorage`, `useStorageContext`, `usePrettifyEditors`, `useCopyQuery`, `useMergeQuery`, the `*Store` aliases (in `@graphiql/react`); `useExplorerContext` (in `@graphiql/plugin-doc-explorer`); and `useHistoryContext` (in `@graphiql/plugin-history`). Replacements were available since v5 — see the [removed-hooks migration guide](https://github.com/graphql/graphiql/blob/c2e792bc446d5d6751bd7cd1d9ac283a4a1d8fc4/docs/migration/graphiql-6.0.0.md#removed-hooks) for one-line replacements.
