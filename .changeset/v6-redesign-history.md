---
'@graphiql/plugin-history': patch
---

pr: 4228

Restyle History for GraphiQL 6 with light and dark themes, shared GraphQL syntax colors, and clearer keyboard focus indicators. Escape cancels a label edit and returns focus to the edit button.

The v5 `--color-*` overrides no longer theme the built-in UI. Migrate custom styles to the new OKLCH tokens using the [CSS and retheming guide](https://github.com/graphql/graphiql/blob/c2e792bc446d5d6751bd7cd1d9ac283a4a1d8fc4/docs/migration/graphiql-6.0.0.md#css-and-retheming).
