---
'monaco-graphql': minor
---

avoid bundling unnecessary languages — import `monaco-graphql/esm/monaco-editor` instead of `monaco-editor` to reduce your bundle size, as that imports only `graphql` and `json` languages and leaves out `ts`, `css`, `html`, and much more
