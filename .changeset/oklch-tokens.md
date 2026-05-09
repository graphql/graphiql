---
'@graphiql/react': minor
---

Introduce the v6 OKLCH design-token system with both dark and light theme palettes. Tokens (`--bg-canvas`, `--fg-default`, `--accent-blue`, etc.) are stored as OKLCH triplets so opacity can be combined at the call site. Themes are keyed off `data-theme` (`dark` is the default; `light` activates explicitly or via `prefers-color-scheme: light` when no override is set). Existing v5 variables are unchanged; component styles continue to use them until they are migrated.
