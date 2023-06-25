---
'monaco-graphql': minor
---

avoid bundling unnecessary languages, import `monaco-graphql/esm/monaco-editor` instead `monaco-editor` if you want to reduce your bundle size that imports only `graphql`/`json` languages instead of `ts`, `css`, `html`... and much more
