---
"@graphiql/plugin-code-exporter": patch
"@graphiql/plugin-explorer": patch
"@graphiql/react": patch
---

set `build.minify: false` for cjs/esm builds since minified variable names change every build time
