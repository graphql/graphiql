---
'graphql-language-service': patch
---

Anchor validation diagnostics at the highlighted node's own position, so the range for an unknown aliased field covers the field name rather than the alias, and the range for an unknown directive covers its name rather than starting at the `@`.
