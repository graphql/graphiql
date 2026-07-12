---
'graphiql': major
'@graphiql/react': minor
'@graphiql/plugin-doc-explorer': minor
'@graphiql/plugin-history': patch
---

A ground-up visual redesign for v6. A new OKLCH-based design-token system brings first-class light and dark themes, driven by a `data-theme` attribute on the GraphiQL container. The layout is rebuilt around a top bar (endpoint and Run action), a left activity rail for plugins, a resizable side panel, a slim status bar, a flattened editor workspace, and a Variables/Headers tab strip. Every built-in component and both Monaco editor themes are restyled to match, and the doc explorer and history panels are rebuilt on the new chrome.

GraphQL syntax coloring is unified across the doc explorer, history, and query builder, with type names colored by category. The mapping is public API for retheming: the `--type-scalar`, `--type-enum`, `--type-input`, and `--type-composite` CSS tokens, plus the `typeCategory` helper exported from `@graphiql/react`.

Custom CSS that overrides GraphiQL's internal class names may need updating; only the CSS custom properties (design tokens) are supported theming API. The build now targets the `defaults` browserslist preset, which covers the modern browsers the OKLCH color system requires. See the migration guide at `docs/migration/graphiql-6.0.0.md`. Refs graphql/graphiql#4219.
