---
'@graphiql/react': minor
'graphiql': minor
---

Add `customScalarSchemas` prop to `GraphiQLProvider`/`GraphiQL`, forwarded to `monaco-graphql`'s per-schema `customScalarSchemas` config. Without it, the variable editor's live JSON Schema linter assumes every custom scalar only accepts primitives (string, number, boolean, integer) and reports a spurious "Incorrect type" error for scalars that legitimately accept objects or arrays (e.g. a `JSON` or `GeoJSON` scalar). `graphql-language-service` and `monaco-graphql` already supported this per-scalar override; `@graphiql/react` just never exposed it.
