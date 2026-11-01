---
'@graphiql/plugin-doc-explorer': minor
---

pr: 4228

Restyle the Documentation Explorer for GraphiQL 6, including light and dark themes, keyboard focus indicators, and GraphQL type-category colors. Customize type colors with `--type-scalar`, `--type-enum`, `--type-input`, and `--type-composite`.

The v5 `--color-*` overrides no longer theme the built-in UI. Migrate custom styles to the new OKLCH tokens using the [CSS and retheming guide](https://github.com/graphql/graphiql/blob/c2e792bc446d5d6751bd7cd1d9ac283a4a1d8fc4/docs/migration/graphiql-6.0.0.md#css-and-retheming).
