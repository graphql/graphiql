---
'graphiql': major
---

Remove the composable `GraphiQL.Toolbar` and `GraphiQL.Logo` slots. Editor actions are now contributed through a plugin's `sessionActions`, and branding is customized through the `brand` prop passed to `<GraphiQL>` (or `<TopBar>` directly). `GraphiQL.Footer` is unchanged. See the [Toolbar and Logo migration guide](https://github.com/graphql/graphiql/blob/c2e792bc446d5d6751bd7cd1d9ac283a4a1d8fc4/docs/migration/graphiql-6.0.0.md#removed-graphiqltoolbar-and-graphiqllogo) for before/after examples.
