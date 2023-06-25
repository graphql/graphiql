---
'monaco-graphql': minor
---

avoid bundling unnecessary languages, import `monaco-graphql/esm/monaco-editor` instead `monaco-editor` if you want to reduce your bundle size and import only `graphql`/`json` languages
