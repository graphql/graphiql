---
'graphiql': minor
---

Include Query Builder and Collections alongside History in GraphiQL's default plugin set. Passing `plugins` replaces this set; use `plugins={[...DEFAULT_PLUGINS, customPlugin]}` to extend it. The Documentation Explorer remains controlled separately by `referencePlugin`.

Export the immutable `DEFAULT_PLUGINS` array, `QUERY_BUILDER_PLUGIN`, and `COLLECTIONS_PLUGIN` from `graphiql` so you can customize the defaults without importing each plugin package.
