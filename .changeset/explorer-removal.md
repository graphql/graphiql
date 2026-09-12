---
'graphiql': major
---

pr: 4416

`@graphiql/plugin-explorer` is removed. Its visual query-building UI is replaced by `@graphiql/plugin-query-builder`, which is default-installed in the `graphiql` meta-package, so the capability is available with no extra setup. If you installed and registered `@graphiql/plugin-explorer` yourself, drop the dependency and the `plugins` entry; if you relied on the default plugin set, there is nothing to change.
