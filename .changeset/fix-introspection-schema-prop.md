---
'@graphiql/react': patch
'graphiql': patch
---

Fix schema prop to skip introspection when IntrospectionQuery data is provided

Previously, passing an `IntrospectionQuery` result as the `schema` prop would still trigger a network introspection request. The `shouldIntrospect` check only recognized `GraphQLSchema` instances (via `isSchema`), not raw introspection data. Now, when an `IntrospectionQuery` is passed, a schema is built from it directly using `buildClientSchema` and introspection is skipped.
