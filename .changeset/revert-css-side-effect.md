---
'@graphiql/react': patch
---

Revert the `*.css` entry from `sideEffects` (added in #4211). The unbounded glob landed in the same release where esm.sh's `?standalone` builder started emitting a much larger preload stub that fragments `monaco-editor` into two instances and breaks syntax highlighting on CDN consumers (#4303). Removing it narrows the package.json delta between the last working version (0.37.3) and the first broken one (0.37.4). A more narrowly-scoped form may return in a follow-up if the webpack tree-shaking issue from #4211 recurs.
