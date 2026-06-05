---
'graphql-language-service': patch
---

Make the fields block optional when parsing object, interface, input, and enum type definitions (and their extensions) in the online parser. Per the GraphQL spec these blocks are optional, so spec-valid SDL such as `extend type Foo @onType` or `type Foo @onType` (directives only, no body) no longer reports `invalidchar` during syntax highlighting.
