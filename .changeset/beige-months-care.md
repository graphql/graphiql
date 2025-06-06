---
'@graphiql/plugin-code-exporter': patch
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-explorer': patch
'graphql-language-service': patch
'@graphiql/plugin-history': patch
'codemirror-graphql': patch
'@graphiql/toolkit': patch
'@graphiql/react': minor
'monaco-graphql': patch
'graphiql': major
---

- allow multiple independent instances of GraphiQL on the same page
- store `onClickReference` in query editor in React `ref`
- remove `onClickReference` from variable editor
- fix shortcut text per OS for run query in execute query button's tooltip and in default query
- allow override all default GraphiQL plugins
