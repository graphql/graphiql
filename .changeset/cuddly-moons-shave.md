---
'graphql-language-service': patch
'monaco-graphql': patch
---

LangugeService should not be imported by `codemirror-graphql`, and thus `picomatch` should not be imported.
