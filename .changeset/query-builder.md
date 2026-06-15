---
'@graphiql/plugin-query-builder': minor
'graphiql': minor
---

Add `@graphiql/plugin-query-builder`, a first-party visual query builder. It renders the schema's root types as a collapsible tree; checking a field adds it to the current operation and unchecking removes it, with the document parsed, mutated, and reprinted through the `graphql` package's AST utilities. Fields expose argument inputs (scalars, enums, lists, and input objects, including lists of input objects), scalar arguments can be promoted to variables, named fragments can be created from a selection, and union/interface fields offer inline-fragment type-condition selectors.

The query builder is default-installed in the `graphiql` meta-package, so it is available with no extra setup.
