---
'graphql-language-service-server': minor
'graphql-language-service-cli': minor
'vscode-graphql': minor
---

upgrades the `vscode-languageserver` and `vscode-jsonrpc` reference implementations for the lsp server to the latest. also upgrades `vscode-languageclient` in `vscode-graphql` to the latest 8.0.1. seems to work fine for IPC in `vscode-graphql` at least!

hopefully this solves #2230 once and for all!
