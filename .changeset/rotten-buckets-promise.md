---
'graphql-language-service-server': minor
'graphql-language-service-cli': patch
'vscode-graphql': patch
---

**Fix:** Disable `getSchema()` results cacheing in the LSP server for now. Schema changes from file and/or network schema should be reflected in other files after they are saved or edit. 

If this leads to excessive introspection schema fetching for URL `schema` configs, we will add an lru schema cache with configurable invalidation timeout. Hopefully `cache-control` headers take care of this problem transparently.



