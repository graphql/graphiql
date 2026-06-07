---
'@graphiql/plugin-query-builder': minor
---

The query builder now handles list arguments (repeat add/remove UI) and input object arguments (recursive nested field editing). Document mutator gains `setListArgValue` and `setInputObjectArgValue` helpers that produce `ListValue` and `ObjectValue` AST nodes, including the mixed case of lists of input objects.
