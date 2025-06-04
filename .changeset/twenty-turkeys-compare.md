---
'monaco-graphql': patch
---

remove unused `MonacoCompletionItem` type

fix `types` field in `package.json`, should be first, before `import` or `require` fields

fixed `monaco-graphql` severity, it was hardcoded to `5` which is not valid value of monaco severity
