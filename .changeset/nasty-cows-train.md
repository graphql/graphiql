---
'@graphiql/react': minor
'graphiql': major
---

- Remove `query`, `variables`, `headers`, and `response` props in `<GraphiQL />` and `<GraphiQLProvider />`

- fix `defaultQuery`, when is set will only be used for the first tab. When opening more tabs, the query editor will start out empty.
