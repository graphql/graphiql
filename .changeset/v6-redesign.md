---
'graphiql': major
'@graphiql/react': minor
---

pr: 4228

Redesign GraphiQL with light and dark themes, an endpoint and Run bar, a plugin activity rail, a resizable side panel, a status bar, and a Variables/Headers tab strip. The Documentation Explorer, History, and Monaco editor themes follow the same design. Settings offer theme, density, and font-size controls.

The top bar joins Run/Stop with the selected operation name, its QRY/MUT/SUB label, and an HTTP method selector. Selecting an operation does not execute it; use Run or the keyboard shortcut. The method menu offers Auto for queries and explains unavailable options. Selected rows use the GraphQL logo pink, while keyboard focus has a separate outline.

The response pane adds HTTP method, status, timing, and size from transports that provide them, a copy action, and persisted JSON, Tree, and Table views. Tree expands response objects and arrays; Table presents each list field separately. Saved operations show when they have unsaved edits, and tabs with multiple operations identify the active operation.

Improve keyboard focus visibility and screen-reader labels throughout the interface. Escape cancels History label edits and returns focus to the edit button. Closing Settings returns focus to its trigger.

Unify GraphQL syntax coloring across Documentation Explorer, History, and Query Builder. Use the `--type-scalar`, `--type-enum`, `--type-input`, and `--type-composite` CSS tokens and the exported `typeCategory` helper to customize type-category colors.

The design tokens use OKLCH colors, and the build targets the `defaults` browserslist preset. The v5 `--color-*` variables remain defined but no longer theme the built-in UI; migrate existing overrides to the new OKLCH tokens. Custom CSS that overrides internal class names may also need updating. See [CSS and retheming](https://github.com/graphql/graphiql/blob/c2e792bc446d5d6751bd7cd1d9ac283a4a1d8fc4/docs/migration/graphiql-6.0.0.md#css-and-retheming) for migration guidance. Refs graphql/graphiql#4219.
