---
'@graphiql/react': patch
---

`setTheme` now mirrors the chosen theme onto `document.documentElement` as a `data-theme` attribute. The v6 OKLCH token cascade in `tokens.css` is gated on `[data-theme='light']` / `[data-theme='dark']` selectors and was previously never matched, so v6 components fell back to the OS `prefers-color-scheme` regardless of the GraphiQL theme toggle. The existing `body.graphiql-light` / `body.graphiql-dark` classes are preserved for backwards compatibility with custom CSS.
