---
'@graphiql/plugin-code-exporter': patch
'@graphiql/plugin-explorer': patch
'@graphiql/react': patch
---

use `vite build --watch` instead of `vite` for `dev` script because we don't need development server for them

do not use `vite-plugin-dts` when generating umd build 
