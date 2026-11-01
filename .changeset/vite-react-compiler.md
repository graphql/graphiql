---
'@graphiql/react': patch
'graphiql': patch
'@graphiql/plugin-code-exporter': patch
'@graphiql/plugin-collections': patch
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-history': patch
'@graphiql/plugin-query-builder': patch
---

Update the Vite build toolchain while retaining React Compiler support for React 18 and 19.

React Compiler 1.0 uses a separate Babel 7 development dependency in compiler-enabled workspaces so the remaining Babel build tools can use Babel 8.
