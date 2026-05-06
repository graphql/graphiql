---
'graphql-language-service': patch
---

Align schema-language parser bodies with the GraphQL spec.

The online parser previously required a body in several places where
the spec marks it as optional, causing valid schema documents to fail
to tokenize cleanly when a definition or extension omitted its body.
The following are now parsed correctly:

- `extend schema` with no root operation type definitions
- `type` / `extend type` with no fields body
- `interface` / `extend interface` with no fields body
- `union` / `extend union` with no member list
- `enum` / `extend enum` with no values body
- `input` / `extend input` with no fields body
