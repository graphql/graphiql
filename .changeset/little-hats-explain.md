---
'monaco-graphql': patch
---

Fixes an off-by-one bug that caused console spam when hovering things in the first line of a graphql file with monaco because `toGraphQLPosition()` from `monaco-graphql` returns 0-based line/col numbers and `getRange()` from `graphql-language-service` expects 1-based line/col numbers.
