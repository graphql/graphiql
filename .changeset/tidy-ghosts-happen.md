---
'graphql-language-service-server': patch
'vscode-graphql': patch
---

Aims to resolve #2421

- graphql config errors only log to output channel, no longer crash the LSP
- more performant LSP request no-ops for failing/missing config

this used to fail silently in the output channel, but vscode introduced a new retry and notification for this

would like to provide more helpful graphql config DX in the future but this should be better for now
