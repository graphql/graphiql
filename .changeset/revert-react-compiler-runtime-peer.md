---
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-history': patch
'@graphiql/react': patch
---

Move `react-compiler-runtime` back to `peerDependencies` (revert of #4140). The earlier move to `dependencies` landed in 0.37.4 alongside esm.sh's `?standalone` builder starting to emit a 115-line preload stub that fragments `monaco-editor` into two instances on CDN consumers (#4303). Putting the dependency back in `peerDependencies` narrows the package.json delta between the last-working `0.37.3` and the first-broken `0.37.4`.
