---
'graphiql': major
---

BREAKING: Implement a new design for the GraphiQL UI. This changes both DOM structure and class names. We consider this a breaking change as custom GraphQL IDEs built on top of GraphiQL relied on these internals, e.g. overriding styles using certain class names.
