---
'graphiql': patch
'@graphiql/react': patch
'@graphiql/plugin-collections': patch
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-history': patch
'@graphiql/plugin-query-builder': patch
'@graphiql/plugin-code-exporter': patch
---

Restore caret ranges (`^1.0.0`) for internal `@graphiql/react` and `@graphiql/toolkit` dependencies. Now that stable versions are published, caret ranges can no longer resolve to prereleases, so the exact pins from the beta cycle are unnecessary.
