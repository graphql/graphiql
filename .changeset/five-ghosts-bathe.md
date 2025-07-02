---
'@graphiql/react': patch
'graphiql': patch
---

fix multiple GraphiQL instances, suffix a unique id for operation, request headers, variables and response URI.

E.g., the first GraphiQL instance will have:
- `1-operation.graphql`
- `1-request-headers.json`
- `1-variables.json`
- `1-response.json`

The 2nd instance will have:

- `2-operation.graphql`
- `2-request-headers.json`
- `2-variables.json`
- `2-response.json`

etc.
