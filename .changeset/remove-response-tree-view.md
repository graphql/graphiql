---
'@graphiql/react': patch
'graphiql': patch
---

Remove the response pane's Tree view. JSON and Table views remain available. A saved Tree preference falls back to JSON. The exported `ResponseView` type now accepts only `'json'` and `'table'`.
