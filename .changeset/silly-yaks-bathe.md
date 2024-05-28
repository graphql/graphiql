---
'graphql-language-service': patch
'graphql-language-service-server': patch
'graphql-language-service-cli': patch
'codemirror-graphql': patch
'cm6-graphql': patch
'monaco-graphql': patch
'vscode-graphql': patch
---

Fixes several issues with Type System (SDL) completion across the ecosystem:

- restores completion for object and input type fields when the document context is not detectable or parseable
- correct top-level completions for either of the unknown, type system or executable definitions. this leads to mixed top level completions when the document is unparseable, but now you are not seemingly restricted to only executable top level definitions
- `.graphqls` ad-hoc standard functionality remains, but is not required, as it is not part of the official spec, and the spec also allows mixed mode documents in theory, and this concept is required when the type is unknown
