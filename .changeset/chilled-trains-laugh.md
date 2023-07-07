---
'codemirror-graphql': major
'graphql-language-service': major
'graphql-language-service-cli': major
'graphql-language-service-server': major
'monaco-graphql': major
'cm6-graphql': minor
'@graphiql/react': minor
'@graphiql/toolkit': minor
---

_BREAKING CHANGE:_ drop commonjs exports in all libraries except for `graphiql`
and `@graphiql/react`

all previously `<package>/esm` paths are now `<package>/dist`

## Monaco-GraphQL Exports Changes

| monaco-graphql v1                          | monaco-graphql v2                    |
|--------------------------------------------|--------------------------------------|
| `monaco-graphql/{esm,dist}/initializeMode` | `monaco-graphql`                     |
| `monaco-graphql`                           | `monaco-graphql/monaco.contribution` |
| `monaco-graphql/{esm,dist}/graphql.worker` | `monaco-graphql/graphql.worker`      |
| `monaco-graphql/{esm,dist}/GraphQLWorker`  | `monaco-graphql/GraphQLWorker`      |
