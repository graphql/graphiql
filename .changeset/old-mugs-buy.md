---
'graphql-language-service': patch
'graphql-language-service-server': patch
'vscode-graphql': patch
---
- upgrade `graphql-config` to latest in server
- remove `graphql-config` dependency from `vscode-graphql` and `graphql-language-service`
- fix `vscode-graphql` esbuild bundling bug in `vscode-graphql` [#2269](https://github.com/graphql/graphiql/issues/2269) by fixing `esbuild` version
