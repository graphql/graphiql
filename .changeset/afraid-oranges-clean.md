---
'graphql-language-service': patch
---

fix: Correctly parse schema extensions with no root operations

Previously, the parser gave schema extensions the same treatment as schema definitions. The requirements are slightly different, however, since a schema extension does not require a list of root operations according to the spec: https://spec.graphql.org/draft/#sec-Schema-Extension.

The rule for parsing a schema extension is now distinct from schema definition, allowing the root operations list to be omitted.
