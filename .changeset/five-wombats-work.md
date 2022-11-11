---
'graphql-language-service-server': patch
'vscode-graphql': patch
'graphql-language-service-cli': patch
---

Add `vscode-graphql.enableLegacyDecorators` setting to enable `@babel/parser`'s `decorators-legacy` plugin instead of the current `decorators`. This may fix issues with
