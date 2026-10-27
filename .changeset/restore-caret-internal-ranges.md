---
'graphiql': patch
'@graphiql/react': patch
'@graphiql/plugin-collections': patch
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-history': patch
'@graphiql/plugin-query-builder': patch
'@graphiql/plugin-code-exporter': patch
'cm6-graphql': patch
'graphql-language-service-cli': patch
'graphql-language-service-server': patch
'monaco-graphql': patch
'vscode-graphql': patch
---

Restore caret ranges for internal GraphiQL dependencies. The RC versions sort after the stale canary and `next` versions that beta ranges selected, so the exact pins from the beta cycle are no longer necessary.
