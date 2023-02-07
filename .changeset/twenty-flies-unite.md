---
'@graphiql/plugin-code-exporter': patch
'@graphiql/plugin-explorer': patch
'@graphiql/react': patch
---

Avoid bundling code from `react/jsx-runtime` so that the package can be used with Preact
