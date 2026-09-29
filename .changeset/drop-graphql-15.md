---
'graphiql': major
'@graphiql/react': major
'@graphiql/toolkit': major
'@graphiql/plugin-doc-explorer': major
'@graphiql/plugin-collections': major
'@graphiql/plugin-query-builder': major
'@graphiql/plugin-code-exporter': major
'cm6-graphql': major
'codemirror-graphql': major
'graphql-language-service': major
'graphql-language-service-cli': major
'graphql-language-service-server': major
'monaco-graphql': major
'vscode-graphql': major
'vscode-graphql-execution': major
---

GraphQL.js 15 and 16.0–16.10 are no longer supported peer dependencies. The supported range is `^16.11.0 || ^17.0.0`. GraphQL.js 16.11 fixes OneOf input validation for nullable variables and tightens input-object coercion to reject arrays, giving GraphiQL 6 a correct baseline for OneOf inputs. Upgrade `graphql` before upgrading these packages.
