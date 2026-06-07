---
'@graphiql/plugin-query-builder': minor
---

Render the schema's root types (Query, Mutation, Subscription) as a collapsible tree in the query builder panel. Checking a field adds it to the current operation document; unchecking removes it. The operation is parsed, mutated, and reprinted using the `graphql` package's AST utilities. Scalar leaf fields are supported in this version; argument inputs, variables, fragments, and unions/interfaces follow in subsequent releases.
