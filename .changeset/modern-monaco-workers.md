---
'graphiql': major
'@graphiql/react': major
'monaco-graphql': major
---

Upgrade the bundled Monaco Editor to 0.57 and adopt the worker and ESM entry points introduced in 0.56. Published packages accept `monaco-editor` `>=0.56.0 <0.58.0`. If you configure Monaco directly, use Monaco 0.56 or 0.57, replace `monaco-editor/esm/vs/*` imports with exported entry points, and configure `MonacoEnvironment.getWorker` to return the GraphQL worker for the `graphql` label. Custom GraphQL workers must initialize immediately and provide non-cloneable configuration by overriding `GraphQLWorker.initialize`. GraphiQL's worker setup helpers handle these changes and load the matching `monaco-graphql` major. See the [GraphiQL 6 migration guide](https://github.com/graphql/graphiql/blob/c2e792bc446d5d6751bd7cd1d9ac283a4a1d8fc4/docs/migration/graphiql-6.0.0.md#monaco-editor-056-and-057-worker-setup) for examples. This update builds on the initial worker migration contributed by @lukasbash.
