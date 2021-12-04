---
'graphiql': patch
---

Include schema description in DocExplorer for schema introspection requests. Enables the `schemaDescription` option for `getIntrospectionQuery()`.
Also includes `deprecationReason` support in DocExplorer for arguments! 
Enables `inputValueDeprecation` in `getIntrospectionQuery()` and displays deprecation section on field doc view.