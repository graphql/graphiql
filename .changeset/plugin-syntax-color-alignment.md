---
'@graphiql/react': patch
'@graphiql/plugin-history': patch
'@graphiql/plugin-query-builder': patch
---

Align GraphQL syntax coloring across the doc explorer, history, and query builder plugins, so type names, field names, and argument names use the same colors everywhere.

Type names are now colored by category — scalars blue, enums green, input
objects gold, and objects/interfaces/unions orange — instead of uniform
orange. The mapping is exposed as public API: the `--type-scalar`,
`--type-enum`, `--type-input`, and `--type-composite` CSS tokens (retheming
surface) and the `typeCategory` helper exported from `@graphiql/react`.
