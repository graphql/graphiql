---
'vscode-graphql': minor
'vscode-graphql-syntax': patch
---

move vscode grammars, basic language support and snippets to graphql syntax extension. `vscode-graphql` now depends on this extension, and provides language server support in addition. this allows alternative LSP servers and non-LSP graphql extensions to use our highlighting only, or allows users to just install the syntax highlighting extension if they don't need LSP server features.
