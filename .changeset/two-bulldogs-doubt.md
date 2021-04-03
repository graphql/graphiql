---
'@graphiql/toolkit': minor
'graphiql': patch
---

`GraphiQL.createClient()` accepts custom `legacyClient`, exports typescript types, fixes #1800.

`createGraphiQLFetcher` now only attempts an `graphql-ws` connection when only `subscriptionUrl` is provided. In order to use `graphql-transport-ws`, you'll need to provide the `legacyClient` option only, and no `subscriptionUrl` or `wsClient` option.
