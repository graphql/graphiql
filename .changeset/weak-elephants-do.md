---
'graphql-language-service-interface': minor
---

Auto-expand selection sets & invoke completion on newline

Introduces `insertText` and completion for field `selectionSets` for the appropriate `field.type`s.
Works across `monaco-graphql` and `graphql-language-service-server`.

Though the changeset is bumping a patch for `codemirror-graphql`, the lsp completion `insertText` is not used by `codemirror`, and thus this lsp enhancment will not change the `codemirror-graphql` experience.