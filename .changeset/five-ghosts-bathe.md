---
'@graphiql/react': patch
'graphiql': patch
---

fix multiple GraphiQL instances, append an incremented number for operation, request headers, variables and reponse URI.

E.g. the first GraphiQL instance will have:
- `operation1.graphql`
- `request-headers1.json`
- `variables1.json`
- `response1.json`

The 2nd instance will have:

- `operation2.graphql`
- `request-headers2.json`
- `variables2.json`
- `response2.json`

etc.
