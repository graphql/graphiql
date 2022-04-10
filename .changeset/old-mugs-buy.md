---
'graphql-language-service': patch
'graphql-language-service-server': patch
'vscode-graphql': patch
---
- fix esbuild bundling issues with vscode-graphql [#2269](https://github.com/graphql/graphiql/issues/2269) by fixing esbuild version
- remove `graphql-language-service` dependency on `graphql-config`, which is only for types
- remove direct `vscode-graphql` dependency on `graphql-config`, which previously existed for op exec client
- resolve `graphql-config` to `4.3.0` in `graphql-language-server`
