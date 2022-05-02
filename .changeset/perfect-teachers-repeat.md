---
'graphql-language-service-server': patch
'vscode-graphql': patch
---

allow disabling query/SDL validation with `graphql-config` setting `{ extensions: { languageService: { enableValidation: false } } }`.

Currently, users receive duplicate validation messages when using our LSP alongside existing validation tools like `graphql-eslint`, and this allows them to disable the LSP feature in that case.
