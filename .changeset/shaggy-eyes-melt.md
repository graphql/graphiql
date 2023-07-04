---
"@graphiql/plugin-explorer": patch
---

Use named `Explorer` import from `graphiql-explorer` to fix an issue where the bundler didn't correctly choose either the `default` or `Explorer` import. This change should ensure that `@graphiql/plugin-explorer` works correctly without `graphiql-explorer` being bundled.
