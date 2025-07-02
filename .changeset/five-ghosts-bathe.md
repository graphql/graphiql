---
'@graphiql/react': patch
'graphiql': patch
---

fix multiple GraphiQL instances, append an incremented number for operation, request headers, variables and reponse URI.

E.g., the first GraphiQL instance will have:
- `1operation.graphql`
- `1request-headers.json`
- `1variables.json`
- `1response.json`

The 2nd instance will have:

- `2operation.graphql`
- `2request-headers.json`
- `2variables.json`
- `2response.json`

etc.
