---
'graphql-language-service-interface': patch
'monaco-graphql': patch
---

Fix a bug with variable completion with duplicate `$$` across the ecosytem. Introduce more `triggerCharacters` across monaco and the LSP server for autocompletion in far more cases
