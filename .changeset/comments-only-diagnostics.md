---
'graphql-language-service': patch
---

Stop reporting a bogus `Syntax Error: Unexpected <EOF>` diagnostic for documents that only contain comments or whitespace. `getDiagnostics` now detects input with no GraphQL tokens and returns no diagnostics, so comment-only editor contents no longer show a syntax error in `monaco-graphql` and `codemirror-graphql`.
