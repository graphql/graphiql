---
'graphiql': major
---

pr: 4416

Replace `@graphiql/plugin-explorer` with `@graphiql/plugin-query-builder`. Remove the Explorer dependency and plugin registration when upgrading. Query Builder is included in GraphiQL's default plugin set; if you supply a custom `plugins` array, add `QUERY_BUILDER_PLUGIN` from `graphiql` to retain query-building support.
