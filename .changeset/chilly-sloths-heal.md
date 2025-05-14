---
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-explorer': patch
'graphql-language-service': patch
'@graphiql/plugin-history': patch
'codemirror-graphql': patch
'@graphiql/toolkit': patch
'@graphiql/react': minor
'graphiql': patch
---

- replace `onCopyQuery` hook with `copyQuery` function
- replace `onMergeQuery` hook with `mergeQuery` function
- replace `onPrettifyEditors` hook with `prettifyEditors` function
- remove `fetcher` prop from `SchemaContextProvider` and `schemaStore`
- add `fetcher` to `executionStore`
