---
'graphql-language-service-server': patch
---

Import `Logger` from `vscode-jsonrpc` instead of `vscode-languageserver`. `Logger` is defined in `vscode-jsonrpc` (a direct dependency) and only reached `vscode-languageserver` through a transitive re-export, which `tsgo` failed to resolve on CI (`Module '"vscode-languageserver"' has no exported member 'Logger'`). Importing from the package that owns the type avoids relying on that fragile re-export chain.
