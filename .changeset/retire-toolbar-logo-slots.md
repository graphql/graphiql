---
'graphiql': major
---

Remove the composable `GraphiQL.Toolbar` and `GraphiQL.Logo` slots. Editor actions are now contributed through a plugin's `sessionActions`, and branding is customized through the `brand` prop passed to `<GraphiQL>` (or `<TopBar>` directly). `GraphiQL.Footer` is unchanged. See the migration guide for before/after examples.
