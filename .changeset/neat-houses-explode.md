---
'graphql-language-service-server': minor
'@graphiql/plugin-code-exporter': minor
'graphql-language-service-cli': minor
'@graphiql/plugin-explorer': minor
'graphql-language-service': minor
'codemirror-graphql': minor
'@graphiql/toolkit': minor
'@graphiql/react': minor
'monaco-graphql': minor
'cm6-graphql': minor
'graphiql': minor
---

officially deprecate graphql@15 support, as our types and other runtime capabilities ceased to be compatible in 2022 or 2023, but the regression tests were disabled
`graphql-language-service` is where the bug is, which is used by all of the libraries and applications in `graphiql` monorepo.
