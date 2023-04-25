---
"graphql-language-service-server": patch
"graphql-language-service": patch
---

fix(graphql-language-service-server): allow getDefinition to work for unions

Fixes the issue where a schema like the below won't allow you to click through to X.

```graphql```
union X = A | B
type A { x: String }
type B { x: String }
type Query { a: X }
```
