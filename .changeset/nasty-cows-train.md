---
'@graphiql/react': minor
'graphiql': major
---

- Remove `query`, `variables`, `headers`, and `response` props from `<GraphiQL />` and `<GraphiQLProvider />`
- Add `initialQuery`, `initialVariables` and `initialHeaders` props
- Fix `defaultQuery`, when is set will only be used for the first tab. When opening more tabs, the query editor will start out empty
- remove `useSynchronizeValue` hook
