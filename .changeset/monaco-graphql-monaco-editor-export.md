---
'monaco-graphql': minor
---

Add `./monaco-editor` to the `exports` map.

`monaco-graphql/monaco-editor` re-exports `monaco-editor` with only the graphql and json languages, skipping the css, html, and typescript contributions that the default `monaco-editor` entry point bundles. Consumers can use it to share a single `monaco-editor` instance with `monaco-graphql` (for `editor`, `Uri`, `KeyMod`, `KeyCode`, `languages`, etc.) without paying for those extras. Until now you had to reach for the unstable `monaco-graphql/esm/monaco-editor` path, which only resolves under legacy `node10`-style module resolution.

The legacy `monaco-graphql/esm/monaco-editor` path still works via the existing `./*` wildcard, so this change is purely additive.

The `monaco-graphql/esm/*` import pattern is now considered deprecated. It will continue to work throughout the `1.x` line, but the wildcard `exports` entry that enables it is planned for removal in the next major version. New code should prefer the canonical paths: `monaco-graphql/monaco-editor`, `monaco-graphql/initializeMode`, `monaco-graphql/graphql.worker`, and `monaco-graphql/lite`.
